import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, activityLog } from "@/lib/db/schema";
import { getCurrentStaff } from "@/lib/auth/current-user";
import { requestMagicLink, MagicLinkError } from "@/lib/auth/magic-link";
import { sendEmail } from "@/lib/email/resend";
import { clientInviteEmail, projectUrlFor } from "@/lib/email/templates/notifications";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params;
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: { members: { with: { user: true } } },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const clientMembers = project.members.filter((m) => m.user.userType === "client");

  // Find a PM or owner to show as the sender.
  const pm = project.members.find((m) => m.role === "pm" || m.role === "owner");
  const pmName = pm?.user.name ?? staff.name;

  let invited = 0;
  const errors: string[] = [];

  await Promise.all(
    clientMembers.map(async (m) => {
      try {
        const { rawToken } = await requestMagicLink({ email: m.user.email });
        const signInUrl = `${APP_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(rawToken)}`;
        const { subject, html, text } = clientInviteEmail({
          recipientName: m.user.name,
          projectName: project.name,
          signInUrl,
          pmName,
        });
        await sendEmail({
          to: m.user.email,
          subject,
          html,
          text,
          template: "client_invite",
          projectId,
          userId: m.user.id,
        });
        invited++;
      } catch (err) {
        if (err instanceof MagicLinkError && err.code === "rate_limited") {
          // Still count as "invited" — they have an existing valid link
          invited++;
        } else {
          errors.push(m.user.email);
        }
      }
    }),
  );

  await db.insert(activityLog).values({
    projectId,
    userId: staff.id,
    action: "client.invited",
    metadata: { clientCount: invited, invitedBy: staff.name },
  });

  return NextResponse.json({ ok: true, invited });
}
