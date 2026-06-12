/**
 * POST /api/projects — manual project creation (and Zapier inbound in Phase 2).
 *
 * Snapshots the chosen template onto the project so future template edits
 * don't break it. Creates the client user (idempotently by email) and adds
 * the staff creator + client as project members.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  projects,
  projectMembers,
  projectTemplates,
  organizations,
  users,
  activityLog,
  type ProjectTemplateSnapshot,
} from "@/lib/db/schema";
import { requireStaff } from "@/lib/auth/current-user";
import { requestMagicLink } from "@/lib/auth/magic-link";
import { sendEmail } from "@/lib/email/resend";
import { magicLinkEmail } from "@/lib/email/templates/magic-link";

export const runtime = "nodejs";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TTL = Number(process.env.MAGIC_LINK_TTL_MINUTES ?? 15);

const schema = z.object({
  serviceTypeId: z.string().uuid(),
  templateId: z.string().uuid(),
  officeId: z.string().uuid(),
  organizationName: z.string().min(1).max(200),
  projectName: z.string().min(1).max(200),
  clientName: z.string().min(1).max(200),
  clientEmail: z.string().email(),
  sendInvite: z.boolean().default(true),
  websiteTheme: z.string().max(100).optional(),
});

export async function POST(req: Request) {
  const staff = await requireStaff();

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const template = await db.query.projectTemplates.findFirst({
    where: eq(projectTemplates.id, parsed.data.templateId),
  });
  if (!template) return NextResponse.json({ error: "template_not_found" }, { status: 404 });

  // Upsert organization by name (loose match — staff will reconcile later).
  let organization = await db.query.organizations.findFirst({
    where: eq(organizations.name, parsed.data.organizationName),
  });
  if (!organization) {
    const [created] = await db
      .insert(organizations)
      .output()
      .values({ name: parsed.data.organizationName });
    if (!created) return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    organization = created;
  }

  // Upsert client user by email.
  const clientEmail = parsed.data.clientEmail.toLowerCase();
  let clientUser = await db.query.users.findFirst({ where: eq(users.email, clientEmail) });
  if (!clientUser) {
    const [created] = await db
      .insert(users)
      .output()
      .values({ email: clientEmail, name: parsed.data.clientName, userType: "client" });
    if (!created) return NextResponse.json({ error: "insert_failed" }, { status: 500 });
    clientUser = created;
  } else if (clientUser.userType !== "client") {
    return NextResponse.json({ error: "email_belongs_to_staff" }, { status: 400 });
  }

  // Snapshot the template.
  const snapshot: ProjectTemplateSnapshot = {
    templateId: template.id,
    templateVersion: template.version,
    templateName: template.name,
    milestoneConfig: template.milestoneConfig,
    fileCategories: template.fileCategories,
    briefStructure: template.briefStructure,
    defaultSettings: template.defaultSettings,
  };
  const firstMilestone = template.milestoneConfig.milestones
    .slice()
    .sort((a, b) => a.order - b.order)[0]?.slug ?? null;

  const [project] = await db
    .insert(projects)
    .output()
    .values({
      organizationId: organization.id,
      templateId: template.id,
      officeId: parsed.data.officeId,
      name: parsed.data.projectName,
      status: "active",
      currentMilestoneSlug: firstMilestone,
      templateSnapshot: snapshot,
      links: {},
      websiteTheme: parsed.data.websiteTheme ?? null,
    });
  if (!project) return NextResponse.json({ error: "insert_failed" }, { status: 500 });

  // Add members: staff creator as owner, client as client.
  try {
    await db
      .insert(projectMembers)
      .values([
        { projectId: project.id, userId: staff.id, role: "owner" },
        { projectId: project.id, userId: clientUser.id, role: "client" },
      ]);
  } catch {
    // ignore duplicate key (member already exists)
  }

  await db.insert(activityLog).values({
    projectId: project.id,
    userId: staff.id,
    action: "project.created",
    metadata: {
      templateId: template.id,
      templateName: template.name,
      organizationName: organization.name,
    },
  });

  // Send invite email if requested.
  if (parsed.data.sendInvite) {
    try {
      const result = await requestMagicLink({ email: clientEmail });
      const signInUrl = `${APP_URL}/api/auth/magic-link/verify?token=${encodeURIComponent(result.rawToken)}`;
      const { subject, html, text } = magicLinkEmail({
        recipientName: clientUser.name,
        signInUrl,
        expiresInMinutes: TTL,
        projectName: parsed.data.projectName,
      });
      await sendEmail({
        to: clientEmail,
        subject,
        html,
        text,
        template: "magic_link_invite",
        userId: clientUser.id,
        projectId: project.id,
      });
    } catch (err) {
      // Rate-limit on a fresh user shouldn't happen; log and continue.
      console.warn("[projects/create] invite send failed", err);
    }
  }

  return NextResponse.json({ ok: true, projectId: project.id });
}
