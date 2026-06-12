import Link from "next/link";
import { desc, eq, and, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { projectMessages, projects, users } from "@/lib/db/schema";

export default async function StaffMessagesPage() {
  const messages = await db
    .select({
      id: projectMessages.id,
      body: projectMessages.body,
      isFromStaff: projectMessages.isFromStaff,
      readAt: projectMessages.readAt,
      createdAt: projectMessages.createdAt,
      projectId: projectMessages.projectId,
      projectName: projects.name,
      senderName: users.name,
    })
    .top(150)
    .from(projectMessages)
    .innerJoin(projects, eq(projects.id, projectMessages.projectId))
    .innerJoin(users, eq(users.id, projectMessages.userId))
    .orderBy(desc(projectMessages.createdAt))
    .catch(() => []);

  const unread = messages.filter((m) => !m.isFromStaff && !m.readAt);

  return (
    <div className="px-6 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl text-brand-navy">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {unread.length} unread · {messages.length} total
          </p>
        </div>
      </div>

      {messages.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No messages yet. Messages sent between staff and clients will appear here.
        </div>
      ) : (
        <div className="rounded-lg border bg-white divide-y">
          {messages.map((msg) => {
            const isUnread = !msg.isFromStaff && !msg.readAt;
            return (
              <Link
                key={msg.id}
                href={`/staff/projects/${msg.projectId}` as never}
                className="flex items-start gap-4 px-4 py-3 text-sm hover:bg-muted/20 transition-colors"
              >
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    isUnread ? "bg-brand-coral" : "bg-transparent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className={`font-medium ${isUnread ? "text-brand-navy" : "text-foreground"}`}>
                      {msg.projectName}
                    </span>
                    <span className="text-xs text-muted-foreground">· {msg.senderName}</span>
                    {msg.isFromStaff && (
                      <span className="text-xs text-muted-foreground">(you)</span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-muted-foreground">{msg.body}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {timeAgo(msg.createdAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function timeAgo(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}
