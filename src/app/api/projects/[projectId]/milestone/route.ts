import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, activityLog } from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";
import { sendEmail } from "@/lib/email/sendgrid";
import { statusChangedEmail, projectUrlFor } from "@/lib/email/templates/notifications";

export const runtime = "nodejs";

const schema = z.object({ milestoneSlug: z.string().min(1) });

export async function PATCH(req: Request, { params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const user = await requireStaff();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { members: { with: { user: true } } },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const milestones = project.templateSnapshot.milestoneConfig.milestones;
  const newMilestone = milestones.find((m) => m.slug === parsed.data.milestoneSlug);
  if (!newMilestone) return NextResponse.json({ error: "unknown_milestone" }, { status: 400 });

  const oldMilestone = milestones.find((m) => m.slug === project.currentMilestoneSlug);

  if (project.currentMilestoneSlug === newMilestone.slug) {
    return NextResponse.json({ ok: true, noChange: true });
  }

  await db
    .update(projects)
    .set({
      currentMilestoneSlug: newMilestone.slug,
      launchedAt: newMilestone.slug === "launch" ? new Date() : project.launchedAt,
    })
    .where(eq(projects.id, projectId));

  await db.insert(activityLog).values({
    projectId,
    userId: user.id,
    action: "project.status_changed",
    metadata: {
      from: project.currentMilestoneSlug,
      to: newMilestone.slug,
    },
  });

  // Notify clients on the project.
  const recipients = project.members.filter((m) => m.user.userType === "client");
  await Promise.all(
    recipients.map(async (m) => {
      const { subject, html, text } = statusChangedEmail({
        recipientName: m.user.name,
        projectName: project.name,
        oldMilestone: oldMilestone?.label,
        newMilestone: newMilestone.label,
        triggeredByName: user.name,
        projectUrl: projectUrlFor(projectId, "client"),
      });
      await sendEmail({
        to: m.user.email,
        subject,
        html,
        text,
        template: "status_changed",
        projectId,
        userId: m.user.id,
        metadata: { from: project.currentMilestoneSlug, to: newMilestone.slug },
      });
    }),
  );

  return NextResponse.json({ ok: true });
}
