import { NextResponse } from "next/server";
import { z } from "zod";
import { eq, asc, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projectMessages,
  projects,
  activityLog,
  notifications,
  users,
} from "@/lib/db/schema";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";
import { isMemberOfProject } from "@/lib/projects/queries";
import { sendEmail } from "@/lib/email/sendgrid";
import { newMessageEmail, projectUrlFor } from "@/lib/email/templates/notifications";

export const runtime = "nodejs";

const postSchema = z.object({
  body: z.string().min(1).max(5000),
});

export async function GET(
  _req: Request,
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

  const rows = await db
    .select({
      id: projectMessages.id,
      body: projectMessages.body,
      isFromStaff: projectMessages.isFromStaff,
      createdAt: projectMessages.createdAt,
      senderName: users.name,
    })
    .from(projectMessages)
    .innerJoin(users, eq(users.id, projectMessages.userId))
    .where(eq(projectMessages.projectId, projectId))
    .orderBy(asc(projectMessages.createdAt));

  // Mark messages from the other party as read.
  const userIsStaff = !!staff;
  await db
    .update(projectMessages)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(projectMessages.projectId, projectId),
        eq(projectMessages.isFromStaff, !userIsStaff),
        isNull(projectMessages.readAt),
      ),
    );

  return NextResponse.json({ messages: rows });
}

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
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const userIsStaff = !!staff;

  const [message] = await db
    .insert(projectMessages)
    .output()
    .values({
      projectId,
      userId: user.id,
      body: parsed.data.body,
      isFromStaff: userIsStaff,
    });
  if (!message) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  await db.insert(activityLog).values({
    projectId,
    userId: user.id,
    action: "message.sent",
    metadata: { isFromStaff: userIsStaff },
  });

  // Fetch project with members to notify the other party.
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { members: { with: { user: true } } },
  });

  if (project) {
    const portalUrl = userIsStaff
      ? projectUrlFor(projectId, "client")
      : projectUrlFor(projectId, "staff");

    const messagePreview = parsed.data.body.slice(0, 200);

    if (userIsStaff) {
      // Notify client members
      const clientMembers = project.members.filter((m) => m.user.userType === "client");
      await Promise.all(
        clientMembers.map(async (m) => {
          const { subject, html, text } = newMessageEmail({
            recipientName: m.user.name,
            senderName: user.name,
            projectName: project.name,
            messagePreview,
            portalUrl,
          });
          await sendEmail({
            to: m.user.email,
            subject,
            html,
            text,
            template: "new_message",
            projectId,
            userId: m.user.id,
          });
          await db.insert(notifications).values({
            userId: m.user.id,
            projectId,
            type: "message_received",
            body: `${user.name} sent you a message`,
            linkHref: "/dashboard/messages",
          });
        }),
      );
    } else {
      // Notify staff PMs/owners
      const staffRecipients = project.members.filter(
        (m) => (m.role === "pm" || m.role === "owner") && m.user.userType === "staff",
      );
      await Promise.all(
        staffRecipients.map(async (m) => {
          const { subject, html, text } = newMessageEmail({
            recipientName: m.user.name,
            senderName: user.name,
            projectName: project.name,
            messagePreview,
            portalUrl,
          });
          await sendEmail({
            to: m.user.email,
            subject,
            html,
            text,
            template: "new_message",
            projectId,
            userId: m.user.id,
          });
        }),
      );
    }
  }

  return NextResponse.json({
    ok: true,
    message: {
      id: message.id,
      body: message.body,
      isFromStaff: message.isFromStaff,
      createdAt: message.createdAt,
    },
  });
}
