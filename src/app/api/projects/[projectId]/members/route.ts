import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users, projectMembers, projects, activityLog } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

const addSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(200).optional(),
  role: z.enum(["owner", "pm", "designer", "developer", "client"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const staff = await requireStaff();

  const project = await db.query.projects.findFirst({ where: eq(projects.id, projectId) });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = addSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { email, name, role } = parsed.data;

  let user = await db.query.users.findFirst({ where: eq(users.email, email.toLowerCase()) });

  if (!user) {
    if (role !== "client") {
      return NextResponse.json(
        { error: "staff_not_found", message: "No staff account found with that email. Staff must already have an account." },
        { status: 422 },
      );
    }
    if (!name?.trim()) {
      return NextResponse.json(
        { error: "name_required", message: "Name is required when adding a new client." },
        { status: 400 },
      );
    }
    const [created] = await db
      .insert(users)
      .output()
      .values({ email: email.toLowerCase(), name: name.trim(), userType: "client" });
    if (!created) return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    user = created;
  }

  const existing = await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.projectId, projectId), eq(projectMembers.userId, user.id)),
  });
  if (existing) {
    return NextResponse.json(
      { error: "already_member", message: "This user is already on the project." },
      { status: 409 },
    );
  }

  await db.insert(projectMembers).values({ projectId, userId: user.id, role });

  await db.insert(activityLog).values({
    projectId,
    userId: staff.id,
    action: "team.member_added",
    metadata: { addedUserId: user.id, role },
  });

  return NextResponse.json({
    ok: true,
    user: { id: user.id, name: user.name, email: user.email, userType: user.userType },
    role,
  });
}
