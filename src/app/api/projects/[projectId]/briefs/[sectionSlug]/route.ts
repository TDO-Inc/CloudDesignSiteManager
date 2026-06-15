import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contentBriefs, projects, activityLog, notifications } from "@/lib/db/schema";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";
import { isMemberOfProject } from "@/lib/projects/queries";
import { sendEmail } from "@/lib/email/sendgrid";
import {
  contentSubmittedEmail,
  revisionRequestedEmail,
  projectUrlFor,
} from "@/lib/email/templates/notifications";

export const runtime = "nodejs";

const patchSchema = z.object({
  content: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["not_started", "in_progress", "submitted", "needs_revision", "complete"]).optional(),
  revisionNote: z.string().max(1000).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string; sectionSlug: string }> },
) {
  const { projectId, sectionSlug } = await params;
  const client = await getCurrentClient();
  const staff = await getCurrentStaff();
  const user = client ?? staff;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Clients must be a member of the project.
  if (client && !(await isMemberOfProject(client.id, projectId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const update: Partial<typeof contentBriefs.$inferInsert> = { updatedAt: new Date() };
  if (parsed.data.content !== undefined) {
    update.content = parsed.data.content as Record<string, unknown>;
    if (!parsed.data.status) update.status = "in_progress";
  }
  if (parsed.data.status) {
    // Only staff can set needs_revision
    if (parsed.data.status === "needs_revision" && !staff) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    update.status = parsed.data.status;
    if (parsed.data.status === "submitted") {
      update.submittedAt = new Date();
      update.submittedByUserId = user.id;
    }
    if (parsed.data.status === "needs_revision") {
      update.revisionNote = parsed.data.revisionNote ?? null;
    }
  }

  // Upsert pattern: try update, fall back to insert.
  const existing = await db.query.contentBriefs.findFirst({
    where: and(eq(contentBriefs.projectId, projectId), eq(contentBriefs.sectionSlug, sectionSlug)),
  });

  let savedStatus = existing?.status;
  if (existing) {
    await db
      .update(contentBriefs)
      .set(update)
      .where(eq(contentBriefs.id, existing.id));
    savedStatus = update.status ?? existing.status;
  } else {
    const [created] = await db
      .insert(contentBriefs)
      .output()
      .values({
        projectId,
        sectionSlug,
        status: update.status ?? "in_progress",
        content: (update.content as Record<string, unknown>) ?? {},
        submittedAt: update.submittedAt,
        submittedByUserId: update.submittedByUserId,
      });
    savedStatus = created?.status ?? (update.status ?? "in_progress");
  }

  // On submit: log activity + notify staff PMs.
  if (parsed.data.status === "submitted") {
    await db.insert(activityLog).values({
      projectId,
      userId: user.id,
      action: "brief.submitted",
      metadata: { sectionSlug },
    });

    // Notify project members with role pm or owner.
    const project = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: { members: { with: { user: true } } },
    });
    if (project) {
      const sectionLabel =
        project.templateSnapshot.briefStructure.sections.find((s) => s.slug === sectionSlug)?.label ?? sectionSlug;
      const recipients = project.members.filter((m) => (m.role === "pm" || m.role === "owner") && m.user.userType === "staff");
      await Promise.all(
        recipients.map(async (m) => {
          const { subject, html, text } = contentSubmittedEmail({
            recipientName: m.user.name,
            submitterName: user.name,
            projectName: project.name,
            sectionLabel,
            projectUrl: projectUrlFor(projectId, "staff"),
          });
          await sendEmail({
            to: m.user.email,
            subject,
            html,
            text,
            template: "content_submitted",
            projectId,
            userId: m.user.id,
            metadata: { sectionSlug },
          });
        }),
      );
    }
  }

  // On needs_revision: log activity + notify clients
  if (parsed.data.status === "needs_revision" && staff) {
    await db.insert(activityLog).values({
      projectId,
      userId: user.id,
      action: "brief.revision_requested",
      metadata: { sectionSlug, revisionNote: parsed.data.revisionNote ?? null },
    });

    const project2 = await db.query.projects.findFirst({
      where: eq(projects.id, projectId),
      with: { members: { with: { user: true } } },
    });
    if (project2) {
      const sectionLabel2 =
        project2.templateSnapshot.briefStructure.sections.find((s) => s.slug === sectionSlug)?.label ?? sectionSlug;
      const clientMembers = project2.members.filter((m) => m.user.userType === "client");
      await Promise.all(
        clientMembers.map(async (m) => {
          if (parsed.data.revisionNote) {
            const { subject, html, text } = revisionRequestedEmail({
              recipientName: m.user.name,
              projectName: project2.name,
              sectionLabel: sectionLabel2,
              revisionNote: parsed.data.revisionNote!,
              portalUrl: `${projectUrlFor(projectId, "client")}/briefs/${sectionSlug}`,
            });
            await sendEmail({
              to: m.user.email,
              subject,
              html,
              text,
              template: "revision_requested",
              projectId,
              userId: m.user.id,
              metadata: { sectionSlug },
            });
          }
          await db.insert(notifications).values({
            userId: m.user.id,
            projectId,
            type: "revision_requested",
            body: `Revision requested on ${sectionLabel2}`,
            linkHref: `/dashboard/briefs/${sectionSlug}`,
          });
        }),
      );
    }
  }

  return NextResponse.json({ ok: true, status: savedStatus });
}
