import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLog, projects, organizations, users } from "@/lib/db/schema";

export default async function ActivityLogPage() {
  const activity = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
      projectId: activityLog.projectId,
      projectName: projects.name,
      orgName: organizations.name,
      actorName: users.name,
    })
    .top(200)
    .from(activityLog)
    .innerJoin(projects, eq(projects.id, activityLog.projectId))
    .innerJoin(organizations, eq(organizations.id, projects.organizationId))
    .leftJoin(users, eq(users.id, activityLog.userId))
    .orderBy(desc(activityLog.createdAt))
    .catch(() => []);

  return (
    <div className="px-6 py-6">
      <div className="mb-6">
        <h1 className="text-2xl text-brand-navy">Activity log</h1>
        <p className="text-sm text-muted-foreground">
          All project activity across your portal
        </p>
      </div>

      {activity.length === 0 ? (
        <div className="rounded-lg border bg-white px-6 py-12 text-center text-sm text-muted-foreground">
          No activity yet. Actions taken on projects will appear here.
        </div>
      ) : (
        <ul className="space-y-1 rounded-lg border bg-white p-2 text-sm">
          {activity.map((a) => (
            <li
              key={a.id}
              className="flex items-start justify-between gap-4 rounded-md px-3 py-2.5 hover:bg-muted/40"
            >
              <div className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                <div>
                  <span className="font-medium text-foreground">
                    {a.actorName ?? "System"}
                  </span>
                  <span className="ml-2 text-muted-foreground">
                    {prettyAction(a.action)}
                  </span>
                  <span className="ml-2 text-muted-foreground">on</span>{" "}
                  <Link
                    href={`/staff/projects/${a.projectId}` as never}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {a.projectName}
                  </Link>
                  <span className="ml-1 text-xs text-muted-foreground">· {a.orgName}</span>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {new Date(a.createdAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function prettyAction(action: string) {
  const map: Record<string, string> = {
    "file.uploaded": "uploaded a file",
    "brief.submitted": "submitted a content brief",
    "project.created": "created a project",
    "project.updated": "updated project details",
    "project.status_changed": "moved to a new stage",
    "team.member_added": "added a team member",
    "team.member_removed": "removed a team member",
    "team.role_changed": "changed a team member's role",
    "note.created": "added an internal note",
    "message.sent": "sent a message",
  };
  return map[action] ?? action.replace(/[._]/g, " ");
}
