import { desc, eq, ilike, or, and, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, organizations, offices } from "@/lib/db/schema";

export interface StaffProjectFilters {
  status?: "all" | "active" | "archived" | "needs_action" | "stalled";
  search?: string;
  officeId?: string;
}

export async function listStaffProjects(filters: StaffProjectFilters = {}) {
  const conditions: SQL[] = [];

  if (filters.status === "active") {
    conditions.push(eq(projects.status, "active"));
  } else if (filters.status === "archived") {
    conditions.push(eq(projects.status, "archived"));
  }
  // "needs_action" and "stalled" are heuristics derived later from briefs.

  if (filters.officeId) {
    conditions.push(eq(projects.officeId, filters.officeId));
  }

  if (filters.search) {
    const q = `%${filters.search}%`;
    const cond = or(ilike(projects.name, q), ilike(organizations.name, q));
    if (cond) conditions.push(cond);
  }

  const rows = await db
    .select({
      id: projects.id,
      name: projects.name,
      status: projects.status,
      currentMilestoneSlug: projects.currentMilestoneSlug,
      templateSnapshot: projects.templateSnapshot,
      organizationName: organizations.name,
      officeName: offices.name,
      createdAt: projects.createdAt,
      launchedAt: projects.launchedAt,
    })
    .from(projects)
    .innerJoin(organizations, eq(organizations.id, projects.organizationId))
    .innerJoin(offices, eq(offices.id, projects.officeId))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(projects.createdAt));

  return rows;
}
