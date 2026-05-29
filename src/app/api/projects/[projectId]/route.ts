import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { projects, files, activityLog, auditLog } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";
import { deleteBlob } from "@/lib/storage/azure";

export const runtime = "nodejs";

/**
 * PATCH /api/projects/:projectId — update project fields (name, links).
 */
const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  links: z.record(z.string(), z.string()).optional(),
  websiteTheme: z.string().max(100).nullable().optional(),
  mondayItemId: z.string().max(50).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const staff = await requireStaff();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const update: Record<string, unknown> = {};
  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.links !== undefined) {
    // Merge with existing links so a partial update doesn't wipe other keys.
    update.links = { ...(project.links as Record<string, string>), ...parsed.data.links };
  }
  if (parsed.data.websiteTheme !== undefined) update.websiteTheme = parsed.data.websiteTheme;
  if (parsed.data.mondayItemId !== undefined) update.mondayItemId = parsed.data.mondayItemId;

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ ok: true, noChange: true });
  }

  await db.update(projects).set(update).where(eq(projects.id, projectId));

  await db.insert(activityLog).values({
    projectId,
    userId: staff.id,
    action: "project.updated",
    metadata: { fields: Object.keys(update) },
  });

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/projects/:projectId — HARD delete.
 *
 * Removes blobs from Azure first, then the project (cascades to briefs,
 * files, members, activity). The audit log entry survives because it has
 * onDelete: set null on userId — but a project_id ref is gone with the
 * project. We write a final audit row referencing the deleted id by string
 * so a future audit query can still see what happened.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const staff = await requireStaff();

  const url = new URL(req.url);
  const confirm = url.searchParams.get("confirm");
  if (confirm !== "yes") {
    return NextResponse.json({ error: "confirm_required", message: "Pass ?confirm=yes to permanently delete." }, { status: 400 });
  }

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Best-effort blob scrub.
  const projectFiles = await db.select().from(files).where(eq(files.projectId, projectId));
  for (const f of projectFiles) {
    try {
      await deleteBlob(f.storageKey);
    } catch (err) {
      console.warn(`[hard-delete] blob ${f.storageKey} delete failed`, err);
    }
  }

  // Audit BEFORE delete (project row is about to vanish).
  await db.insert(auditLog).values({
    userId: staff.id,
    action: "project.hard_delete",
    targetType: "project",
    targetId: projectId,
    metadata: {
      projectName: project.name,
      organizationId: project.organizationId,
      fileCount: projectFiles.length,
    },
  });

  await db.delete(projects).where(eq(projects.id, projectId));

  return NextResponse.json({ ok: true });
}
