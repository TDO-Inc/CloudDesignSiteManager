/**
 * POST /api/projects/:projectId/files
 *
 * Called by the browser AFTER it has PUT the file to the SAS upload URL. We
 * register the file, kick off the scan via the configured ScanProvider, and
 * email the relevant staff PMs.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { files, projects, activityLog } from "@/lib/db/schema";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";
import { isMemberOfProject } from "@/lib/projects/queries";
import { getScanProvider } from "@/lib/storage/scan-providers";
import { sendEmail } from "@/lib/email/sendgrid";
import { fileUploadedEmail, projectUrlFor } from "@/lib/email/templates/notifications";

export const runtime = "nodejs";

const schema = z.object({
  filename: z.string().min(1).max(255),
  storageKey: z.string().min(1).max(500),
  contentType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  category: z.string().min(1).max(60),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const client = await getCurrentClient();
  const staff = await getCurrentStaff();
  const user = client ?? staff;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (client && !(await isMemberOfProject(client.id, projectId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const [created] = await db
    .insert(files)
    .output()
    .values({
      projectId,
      uploadedByUserId: user.id,
      category: parsed.data.category,
      filename: parsed.data.filename,
      storageKey: parsed.data.storageKey,
      sizeBytes: parsed.data.sizeBytes,
      mimeType: parsed.data.contentType,
      scanStatus: "pending",
    });
  if (!created) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  // Kick off scan. NoOpScanProvider returns "clean" immediately.
  let scanStatus: "pending" | "clean" | "infected" | "error" = "pending";
  try {
    const provider = getScanProvider();
    const result = await provider.scan({
      storageKey: created.storageKey,
      filename: created.filename,
      mimeType: created.mimeType,
      sizeBytes: created.sizeBytes,
    });
    scanStatus = result.status === "pending" ? "pending" : result.status;
    await db
      .update(files)
      .set({
        scanStatus,
        scanCompletedAt: result.status === "pending" ? null : new Date(),
        scanDetails: result.details ?? null,
      })
      .where(eq(files.id, created.id));
  } catch (err) {
    console.error("[scan]", err);
    await db
      .update(files)
      .set({ scanStatus: "error", scanCompletedAt: new Date() })
      .where(eq(files.id, created.id));
    scanStatus = "error";
  }

  await db.insert(activityLog).values({
    projectId,
    userId: user.id,
    action: "file.uploaded",
    metadata: {
      fileId: created.id,
      filename: parsed.data.filename,
      category: parsed.data.category,
      scanStatus,
    },
  });

  // Notify PMs / owners (don't block on email failures).
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { members: { with: { user: true } } },
  });
  if (project) {
    const recipients = project.members.filter(
      (m) => (m.role === "pm" || m.role === "owner") && m.user.userType === "staff",
    );
    const categoryLabel =
      project.templateSnapshot.fileCategories.categories.find((c) => c.slug === parsed.data.category)?.label ??
      parsed.data.category;

    await Promise.all(
      recipients.map(async (m) => {
        const { subject, html, text } = fileUploadedEmail({
          recipientName: m.user.name,
          uploaderName: user.name,
          projectName: project.name,
          filename: parsed.data.filename,
          category: categoryLabel,
          projectUrl: projectUrlFor(projectId, "staff"),
        });
        await sendEmail({
          to: m.user.email,
          subject,
          html,
          text,
          template: "file_uploaded",
          projectId,
          userId: m.user.id,
          metadata: { fileId: created.id },
        });
      }),
    );
  }

  return NextResponse.json({ ok: true, fileId: created.id, scanStatus });
}
