import { NextResponse } from "next/server";
import { eq, and, isNull, desc } from "drizzle-orm";
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

  // Count unread messages from staff (for client) or from client (for staff).
  // We count messages where readAt IS NULL and isFromStaff matches the sender being the other party.
  let unreadMessages = 0;
  try {
    if (client) {
      // Client: count unread messages from staff on their projects
      const memberships = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.userId, user.id));

      if (memberships.length > 0) {
        const projectIds = memberships.map((m) => m.projectId);
        // Count messages where isFromStaff = true and readAt IS NULL
        let count = 0;
        for (const projectId of projectIds) {
          const rows = await db
            .select({ id: projectMessages.id })
            .from(projectMessages)
            .where(
              and(
                eq(projectMessages.projectId, projectId),
                eq(projectMessages.isFromStaff, true),
                isNull(projectMessages.readAt),
              ),
            );
          count += rows.length;
        }
        unreadMessages = count;
      }
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
