import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, activityLog, auditLog } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const staff = await requireStaff();

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db
    .update(projects)
    .set({ status: "archived", archivedAt: new Date() })
    .where(eq(projects.id, projectId));

  await db.insert(activityLog).values({
    projectId,
    userId: staff.id,
    action: "project.archived",
    metadata: {},
  });
  await db.insert(auditLog).values({
    userId: staff.id,
    action: "project.archive",
    targetType: "project",
    targetId: projectId,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  // Restore from archive.
  const { projectId } = await params;
  const staff = await requireStaff();

  await db
    .update(projects)
    .set({ status: "active", archivedAt: null })
    .where(eq(projects.id, projectId));

  await db.insert(activityLog).values({
    projectId,
    userId: staff.id,
    action: "project.unarchived",
    metadata: {},
  });

  return NextResponse.json({ ok: true });
}
