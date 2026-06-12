import Link from "next/link";
import { desc, eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { activityLog, projects, organizations, users, projectMessages } from "@/lib/db/schema";
import { listStaffProjects } from "@/lib/projects/staff-queries";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { computeProjectProgress } from "@/lib/projects/queries";
import { DashboardSection, FilterChips } from "@/components/staff/dashboard-section";
import { DashboardTabs } from "@/components/staff/dashboard-tabs";
import { ProjectsTabContent } from "@/components/staff/projects-tab-content";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function StaffDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const defaultTab = params.tab === "projects" ? "projects" : "summary";

  const [allProjects, unreadMessages, recentActivity] = await Promise.all([
    listStaffProjects().catch(() => []),
    db
      .select({
        id: projectMessages.id,
        body: projectMessages.body,
        createdAt: projectMessages.createdAt,
        projectId: projectMessages.projectId,
        projectName: projects.name,
        senderName: users.name,
      })
      .top(10)
      .from(projectMessages)
      .innerJoin(projects, eq(projects.id, projectMessages.projectId))
      .innerJoin(users, eq(users.id, projectMessages.userId))
      .where(and(eq(projectMessages.isFromStaff, false), isNull(projectMessages.readAt)))
      .orderBy(desc(projectMessages.createdAt))
      .catch(() => []),
    db
      .select({
        id: activityLog.id,
        action: activityLog.action,
        createdAt: activityLog.createdAt,
        projectId: activityLog.projectId,
        projectName: projects.name,
        actorName: users.name,
      })
      .top(8)
      .from(activityLog)
      .innerJoin(projects, eq(projects.id, activityLog.projectId))
      .leftJoin(users, eq(users.id, activityLog.userId))
      .orderBy(desc(activityLog.createdAt))
      .catch(() => []),
  ]);

  const activeProjects = allProjects.filter((p) => p.status === "active");

  // Strip non-serializable Date fields before passing to the client component.
  const projectsForTab = allProjects.map((p) => ({
    id: p.id,
    name: p.name,
    status: p.status,
    currentMilestoneSlug: p.currentMilestoneSlug,
    organizationName: p.organizationName,
    officeName: p.officeName,
    templateSnapshot: {
      templateName: p.templateSnapshot.templateName,
      milestoneConfig: { milestones: p.templateSnapshot.milestoneConfig.milestones },
    },
  }));

  const summaryContent = (
    <div className="space-y-4">
      <DashboardSection title="Messages" badge={{ tone: "coral", count: unreadMessages.length }} defaultOpen>
        {unreadMessages.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">No unread client messages.</p>
        ) : (
          <ul className="divide-y">
            {unreadMessages.map((msg) => (
              <li key={msg.id} className="flex items-start gap-3 py-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-coral" />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/staff/projects/${msg.projectId}` as never}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {msg.projectName}
                  </Link>
                  <span className="ml-2 text-muted-foreground">· {msg.senderName}</span>
                  <p className="mt-0.5 truncate text-muted-foreground">{msg.body}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">{timeAgo(msg.createdAt)}</span>
                  <Link
                    href={`/staff/projects/${msg.projectId}` as never}
                    className="text-xs text-brand-green hover:underline"
                  >
                    Reply
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection
        title="Client updates"
        badge={{ tone: "green", count: recentActivity.length }}
        defaultOpen
      >
        {recentActivity.length === 0 ? (
          <p className="px-1 py-2 text-sm text-muted-foreground">No recent client activity.</p>
        ) : (
          <ul className="divide-y">
            {recentActivity.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="h-2 w-2 rounded-full bg-brand-green" />
                <div className="flex-1">
                  <Link
                    href={`/staff/projects/${a.projectId}` as never}
                    className="font-medium text-brand-navy hover:underline"
                  >
                    {a.projectName}
                  </Link>
                  <span className="ml-2 text-muted-foreground">
                    {prettyAction(a.action)}
                    {a.actorName ? ` · ${a.actorName}` : ""}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(a.createdAt)}</span>
                <Link
                  href={`/staff/projects/${a.projectId}` as never}
                  className="text-xs text-brand-green hover:underline"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection
        title="My projects"
        badge={{ tone: "green", count: activeProjects.length }}
        right={<FilterChips />}
        defaultOpen
      >
        {activeProjects.length === 0 ? (
          <div className="px-1 py-6 text-center text-sm text-muted-foreground">
            No active projects yet.{" "}
            <Link href="/staff/projects/new" className="text-brand-green hover:underline">
              Create one →
            </Link>
          </div>
        ) : (
          <ul className="divide-y">
            {activeProjects.slice(0, 8).map((p) => {
              const progress = computeProjectProgress({
                templateSnapshot: p.templateSnapshot,
                briefs: [],
                currentMilestoneSlug: p.currentMilestoneSlug,
              });
              const ms =
                p.templateSnapshot.milestoneConfig.milestones[progress.currentMilestoneIndex];
              return (
                <li key={p.id} className="flex items-center gap-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/staff/projects/${p.id}` as never}
                      className="font-medium text-brand-navy hover:underline"
                    >
                      {p.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">
                      {p.templateSnapshot.templateName} · {p.officeName}
                    </div>
                  </div>
                  <MilestoneBadge slug={ms?.slug ?? "kickoff"} label={ms?.label ?? "Kickoff"} />
                  <div className="w-32">
                    <Progress value={progress.percent} className="h-1.5" />
                  </div>
                  <span className="w-10 text-right text-xs text-muted-foreground">
                    {progress.percent}%
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardSection>

      <DashboardSection title="Recently auto-created" badge={{ tone: "muted", count: 0 }}>
        <p className="px-1 py-2 text-sm text-muted-foreground">
          Auto-created projects from HubSpot / monday.com integrations will appear here in Phase 2.
        </p>
      </DashboardSection>
    </div>
  );

  return (
    <div className="px-6 py-6">
      <DashboardTabs
        defaultTab={defaultTab}
        summaryContent={summaryContent}
        projectsContent={<ProjectsTabContent projects={projectsForTab} />}
      />
    </div>
  );
}

function MilestoneBadge({ slug, label }: { slug: string; label: string }) {
  const palette: Record<string, string> = {
    kickoff: "bg-brand-purple text-purple-800",
    content_collection: "bg-brand-amber text-amber-800",
    round_1_review: "bg-brand-blue text-blue-800",
    revisions: "bg-brand-pink text-pink-800",
    pre_launch_setup: "bg-brand-green-100 text-brand-green-600",
    training_and_approval: "bg-brand-green-100 text-brand-green-600",
    launch: "bg-brand-green text-white",
  };
  return (
    <Badge className={`${palette[slug] ?? "bg-muted text-muted-foreground"} border-transparent`}>
      {label}
    </Badge>
  );
}

function prettyAction(action: string) {
  const map: Record<string, string> = {
    "file.uploaded": "uploaded a file",
    "brief.submitted": "submitted a content brief",
    "project.created": "project created",
    "project.status_changed": "moved to a new stage",
  };
  return map[action] ?? action.replace(/[._]/g, " ");
}

function timeAgo(d: Date) {
  const diff = Date.now() - new Date(d).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
