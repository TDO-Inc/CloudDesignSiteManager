import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { projectMembers, projects, activityLog } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const patchSchema = z.object({
  role: z.enum(["owner", "pm", "designer", "developer", "client"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> },
) {
  const { projectId, userId } = await params;
  const staff = await requireStaff();

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const member = await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
  });
  if (!member) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db
    .update(projectMembers)
    .set({ role: parsed.data.role })
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

  await db.insert(activityLog).values({
    projectId,
    userId: staff.id,
    action: "team.role_changed",
    metadata: { targetUserId: userId, newRole: parsed.data.role },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ projectId: string; userId: string }> },
) {
  const { projectId, userId } = await params;
  const staff = await requireStaff();

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const member = await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)),
  });
  if (!member) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db
    .delete(projectMembers)
    .where(and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, userId)));

  await db.insert(activityLog).values({
    projectId,
    userId: staff.id,
    action: "team.member_removed",
    metadata: { removedUserId: userId },
  });

  return NextResponse.json({ ok: true });
}
