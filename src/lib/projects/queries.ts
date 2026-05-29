import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  projectMembers,
  contentBriefs,
  files,
  organizations,
  internalNotes,
  activityLog,
  users,
  type ProjectTemplateSnapshot,
} from "@/lib/db/schema";

export type ClientProjectListItem = {
  id: string;
  name: string;
  status: "active" | "archived" | "cancelled";
  currentMilestoneSlug: string | null;
  templateName: string;
  organizationName: string;
};

/** Projects the given client user is a member of. */
export async function listClientProjects(userId: string): Promise<ClientProjectListItem[]> {
  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));

  if (memberships.length === 0) return [];

  const ids = memberships.map((m) => m.projectId);
  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      currentMilestoneSlug: projects.currentMilestoneSlug,
      templateSnapshot: projects.templateSnapshot,
      organizationName: organizations.name,
    })
    .from(projects)
    .innerJoin(organizations, eq(organizations.id, projects.organizationId))
    .where(inArray(projects.id, ids));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    currentMilestoneSlug: r.currentMilestoneSlug,
    templateName: (r.templateSnapshot as ProjectTemplateSnapshot).templateName,
    organizationName: r.organizationName,
  }));
}

/** Detailed project payload — for the client dashboard or the staff detail view. */
export async function getProjectDetail(projectId: string) {
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      organization: true,
      office: true,
      members: { with: { user: true } },
      briefs: true,
      files: true,
    },
  });
  if (!project) return null;

  return project;
}

/** Is this user a member of this project? Used for client-side authz. */
export async function isMemberOfProject(userId: string, projectId: string): Promise<boolean> {
  const row = await db.query.projectMembers.findFirst({
    where: and(eq(projectMembers.userId, userId), eq(projectMembers.projectId, projectId)),
  });
  return !!row;
}

/** Pick the "primary" project for a client — the first active one. */
export async function getPrimaryClientProject(userId: string) {
  const memberships = await db
    .select({ projectId: projectMembers.projectId })
    .from(projectMembers)
    .where(eq(projectMembers.userId, userId));

  if (memberships.length === 0) return null;

  const ids = memberships.map((m) => m.projectId);
  const project = await db.query.projects.findFirst({
    where: and(inArray(projects.id, ids), eq(projects.status, "active")),
    with: { organization: true, briefs: true, files: true },
  });
  return project ?? null;
}

/** Activity timeline for a project (newest first). */
export async function getProjectActivity(projectId: string, limit = 50) {
  const rows = await db
    .select({
      id: activityLog.id,
      action: activityLog.action,
      metadata: activityLog.metadata,
      createdAt: activityLog.createdAt,
      userName: users.name,
    })
    .from(activityLog)
    .leftJoin(users, eq(users.id, activityLog.userId))
    .where(eq(activityLog.projectId, projectId))
    .orderBy(desc(activityLog.createdAt))
    .limit(limit);
  return rows;
}

/** Internal notes for staff. */
export async function getProjectNotes(projectId: string) {
  return db
    .select({
      id: internalNotes.id,
      body: internalNotes.body,
      createdAt: internalNotes.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(internalNotes)
    .innerJoin(users, eq(users.id, internalNotes.authorUserId))
    .where(eq(internalNotes.projectId, projectId))
    .orderBy(desc(internalNotes.createdAt));
}

export function computeProjectProgress(project: {
  templateSnapshot: ProjectTemplateSnapshot;
  briefs: Array<{ status: string; sectionSlug: string }>;
  currentMilestoneSlug: string | null;
}) {
  const sections = project.templateSnapshot.briefStructure.sections;
  const totalSections = sections.length;
  const completed = project.briefs.filter((b) => b.status === "complete" || b.status === "submitted").length;
  const fraction = totalSections === 0 ? 0 : completed / totalSections;
  const milestones = project.templateSnapshot.milestoneConfig.milestones;
  const currentIdx = milestones.findIndex((m) => m.slug === project.currentMilestoneSlug);
  const milestoneFraction = milestones.length === 0 || currentIdx < 0
    ? 0
    : (currentIdx + 1) / milestones.length;

  // Blend section completion and milestone progression so the bar reflects both.
  const pct = Math.round((fraction * 0.6 + milestoneFraction * 0.4) * 100);
  return {
    sectionsCompleted: completed,
    sectionsTotal: totalSections,
    currentMilestoneIndex: currentIdx < 0 ? 0 : currentIdx,
    milestonesTotal: milestones.length,
    percent: Math.min(100, Math.max(0, pct)),
  };
}

/** Status of a single brief section for the client dashboard cards. */
export function sectionStatusBadge(
  section: { slug: string },
  briefs: Array<{ sectionSlug: string; status: string; content: Record<string, unknown> }>,
): { label: string; tone: "success" | "warning" | "muted" } {
  const brief = briefs.find((b) => b.sectionSlug === section.slug);
  if (!brief || brief.status === "not_started") {
    return { label: "To do", tone: "muted" };
  }
  if (brief.status === "complete" || brief.status === "submitted") {
    return { label: "Done", tone: "success" };
  }
  // count populated keys
  const filled = Object.values(brief.content ?? {}).filter(
    (v) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0),
  ).length;
  return { label: filled > 0 ? `${filled} done` : "Started", tone: "warning" };
}
