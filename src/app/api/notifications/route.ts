import { NextResponse } from "next/server";
import { eq, and, isNull, desc, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, projectMessages, projectMembers } from "@/lib/db/schema";
import { getCurrentClient, getCurrentStaff } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const client = await getCurrentClient();
  const staff = await getCurrentStaff();
  const user = client ?? staff;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Fetch last 20 notifications for this user
  const notifRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20)
    .catch(() => []);

  // Count unread notifications
  const unreadNotifications = notifRows.filter((n) => !n.readAt).length;

  // Count unread messages from the *other* party on the user's projects:
  // staff messages for a client, client messages for staff. `readAt` is set
  // globally on a message when the opposite party opens that project's thread,
  // so a message is "unread for me" when it's from the other party and unread.
  // Staff are also rows in project_members, so the same membership scope works
  // for both — we just flip which sender direction counts.
  let unreadMessages = 0;
  try {
    const memberships = await db
      .select({ projectId: projectMembers.projectId })
      .from(projectMembers)
      .where(eq(projectMembers.userId, user.id));

    if (memberships.length > 0) {
      const projectIds = memberships.map((m) => m.projectId);
      // A client cares about staff-authored messages; staff cares about
      // client-authored ones.
      const fromOtherParty = client ? true : false;
      const rows = await db
        .select({ id: projectMessages.id })
        .from(projectMessages)
        .where(
          and(
            inArray(projectMessages.projectId, projectIds),
            eq(projectMessages.isFromStaff, fromOtherParty),
            isNull(projectMessages.readAt),
          ),
        );
      unreadMessages = rows.length;
    }
  } catch {
    unreadMessages = 0;
  }

  const unreadTotal = unreadNotifications + unreadMessages;

  return NextResponse.json({
    notifications: notifRows.map((n) => ({
      id: n.id,
      type: n.type,
      body: n.body,
      linkHref: n.linkHref,
      readAt: n.readAt,
      createdAt: n.createdAt,
    })),
    unreadMessages,
    unreadTotal,
  });
}
