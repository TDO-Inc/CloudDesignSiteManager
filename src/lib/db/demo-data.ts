/**
 * Demo data seed — realistic sample organizations, projects, client users,
 * content briefs, files, activity, and internal notes.
 *
 * Called from `seed.ts`. Idempotent: existing rows are matched by natural
 * keys (org name, user email, project name) and won't be duplicated.
 *
 * What this builds:
 *   - 3 organizations × 1 project each (different milestones / templates)
 *   - 3 client contacts (one per org), seeded as users with no password
 *     (clients sign in via magic link)
 *   - Admin staff user added as owner on every project
 *   - Content briefs in mixed states (complete / in_progress / not_started)
 *   - File records (no actual blobs — for UI demo only)
 *   - Activity log entries and a few internal notes
 */

import { and, eq } from "drizzle-orm";
import { db } from "./index";
import {
  organizations,
  projects,
  projectMembers,
  contentBriefs,
  files,
  activityLog,
  internalNotes,
  users,
  type ProjectTemplateSnapshot,
} from "./schema";

interface SeedDeps {
  adminUserId: string;
  templates: { Basic: { id: string }; Standard: { id: string } };
  officeId: string;
  staffUserIds?: { rona: string; sean: string; sandra: string };
}

interface ClientUserSpec {
  email: string;
  name: string;
}

interface ProjectSpec {
  organizationName: string;
  projectName: string;
  template: "Basic" | "Standard";
  currentMilestoneSlug: string;
  /** Days since project was created — keeps "Created" dates realistic. */
  ageDays: number;
  client: ClientUserSpec;
  /** Section slugs that should be marked submitted/complete. */
  doneSectionSlugs: string[];
  /** Section slugs that should be partially filled. */
  inProgressSections: Array<{ slug: string; content: Record<string, unknown> }>;
  /** File records to create (with placeholder storage keys — no actual blobs). */
  files: Array<{
    category: string;
    filename: string;
    mimeType: string;
    sizeBytes: number;
    daysAgo: number;
  }>;
  /** Internal notes from the admin. */
  notes: string[];
  /** Sample activity log rows (in addition to ones derived from the above). */
  extraActivity: Array<{
    action: string;
    metadata?: Record<string, unknown>;
    daysAgo: number;
    byClient?: boolean;
  }>;
  links?: Record<string, string>;
  websiteTheme?: string;
  /** Staff roles to assign beyond the admin owner. Keys must match staffUserIds. */
  extraStaff?: Array<{ key: "rona" | "sean" | "sandra"; role: "pm" | "designer" | "developer" }>;
}

const PROJECT_SPECS: ProjectSpec[] = [
  // ── Demo login project (demo@tdo4endo.com dev-bypass client) ────────────
  // Gives the "Demo Client" dev sign-in a real, populated project so the
  // dashboard, content briefs, files, and progress bar all render.
  {
    organizationName: "Demo Endodontics",
    projectName: "Demo Endodontics — Website Project",
    template: "Standard",
    currentMilestoneSlug: "content_collection",
    ageDays: 10,
    client: {
      email: "demo@tdo4endo.com",
      name: "Demo Client",
    },
    doneSectionSlugs: ["office_details", "branding", "home"],
    inProgressSections: [
      {
        slug: "doctor_bios",
        content: {
          doctors: [
            {
              full_name: "Dr. Alex Demo",
              credentials: "DDS, MS",
              bio: "Dr. Demo is a board-certified endodontist focused on comfortable, microscope-assisted root canal therapy.",
              education: "DDS — University of Michigan; MS — Endodontics, NYU",
              memberships: "American Association of Endodontists",
              specialties: "Microscopic endodontics, retreatment",
              personal_interests: "",
            },
          ],
        },
      },
      {
        slug: "services",
        content: {
          standard_services: ["Root canal treatment", "Root canal retreatment"],
          root_canal_notes: "",
        },
      },
    ],
    files: [
      { category: "logo_branding", filename: "demo-endo-logo.svg", mimeType: "image/svg+xml", sizeBytes: 16_200, daysAgo: 8 },
      { category: "doctor_photos", filename: "dr-demo-headshot.jpg", mimeType: "image/jpeg", sizeBytes: 815_000, daysAgo: 6 },
      { category: "office_exterior", filename: "office-front.jpg", mimeType: "image/jpeg", sizeBytes: 1_650_000, daysAgo: 6 },
    ],
    notes: [
      "Demo project for internal testing — exercises the populated client dashboard, content briefs, and file views.",
    ],
    extraActivity: [
      { action: "project.created", daysAgo: 10 },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 8 },
      { action: "brief.submitted", metadata: { sectionSlug: "office_details" }, daysAgo: 6, byClient: true },
      { action: "brief.submitted", metadata: { sectionSlug: "branding" }, daysAgo: 5, byClient: true },
    ],
    links: { staging_url: "https://staging.demoendo.tdo-portal.example.com" },
  },
  {
    organizationName: "Roberts Endodontics",
    projectName: "Roberts Endodontics — Website Refresh",
    template: "Standard",
    currentMilestoneSlug: "content_collection",
    ageDays: 14,
    client: {
      email: "dr.roberts@robertsendodontics.example.com",
      name: "Dr. Jane Roberts",
    },
    doneSectionSlugs: ["office_details", "branding"],
    inProgressSections: [
      {
        slug: "doctor_bios",
        content: {
          doctors: [
            {
              full_name: "Dr. Jane Roberts",
              credentials: "DDS, MS",
              bio: "Dr. Roberts has been practicing endodontics in the greater Springfield area for over 15 years.",
              education: "DDS — University of Michigan; MS — Endodontics, NYU",
              memberships: "American Association of Endodontists",
              specialties: "Microscopic endodontics, retreatment",
              personal_interests: "",
            },
            {
              full_name: "Dr. Marcus Lee",
              credentials: "DDS",
              bio: "",
              education: "DDS — UCLA School of Dentistry",
              memberships: "",
              specialties: "",
              personal_interests: "",
            },
          ],
        },
      },
      {
        slug: "home",
        content: {
          tagline: "Specialized endodontic care, delivered with comfort.",
          welcome_message: "",
          differentiators: "",
          primary_cta: "Schedule a consultation",
        },
      },
    ],
    files: [
      { category: "logo_branding", filename: "roberts-endo-logo.svg", mimeType: "image/svg+xml", sizeBytes: 18_432, daysAgo: 12 },
      { category: "logo_branding", filename: "brand-guidelines.pdf", mimeType: "application/pdf", sizeBytes: 1_245_000, daysAgo: 12 },
      { category: "doctor_photos", filename: "dr-roberts-headshot.jpg", mimeType: "image/jpeg", sizeBytes: 842_100, daysAgo: 10 },
      { category: "doctor_photos", filename: "dr-lee-headshot.jpg", mimeType: "image/jpeg", sizeBytes: 798_200, daysAgo: 10 },
      { category: "office_exterior", filename: "exterior-front.jpg", mimeType: "image/jpeg", sizeBytes: 1_840_000, daysAgo: 7 },
      { category: "office_waiting_room", filename: "waiting-room-1.jpg", mimeType: "image/jpeg", sizeBytes: 1_920_000, daysAgo: 7 },
      { category: "office_waiting_room", filename: "waiting-room-2.jpg", mimeType: "image/jpeg", sizeBytes: 1_780_000, daysAgo: 7 },
      { category: "office_operatory", filename: "operatory-1.jpg", mimeType: "image/jpeg", sizeBytes: 2_010_000, daysAgo: 7 },
    ],
    notes: [
      "Kickoff call went well. Office is enthusiastic — Dr. Roberts is engaged and timely with content. Dr. Lee is newer and still drafting his bio.",
      "Brand guidelines PDF received. Mostly purple + navy. Will use as the basis for the design comp.",
    ],
    extraActivity: [
      { action: "project.created", daysAgo: 14 },
      { action: "brief.submitted", metadata: { sectionSlug: "office_details" }, daysAgo: 10, byClient: true },
      { action: "brief.submitted", metadata: { sectionSlug: "branding" }, daysAgo: 9, byClient: true },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 12 },
    ],
    links: { staging_url: "https://staging.robertsendo.tdo-portal.example.com" },
  },
  {
    organizationName: "Mountain View Dental Specialists",
    projectName: "Mountain View — New 5-page Site",
    template: "Basic",
    currentMilestoneSlug: "round_1_review",
    ageDays: 35,
    client: {
      email: "mchen@mountainviewdental.example.com",
      name: "Dr. Michael Chen",
    },
    doneSectionSlugs: ["office_details", "branding", "doctor_bios", "home", "must_include", "technology"],
    inProgressSections: [],
    files: [
      { category: "logo_branding", filename: "mvd-logo.png", mimeType: "image/png", sizeBytes: 92_000, daysAgo: 33 },
      { category: "doctor_photos", filename: "dr-chen.jpg", mimeType: "image/jpeg", sizeBytes: 720_000, daysAgo: 32 },
      { category: "office_exterior", filename: "front-entrance.jpg", mimeType: "image/jpeg", sizeBytes: 1_510_000, daysAgo: 30 },
      { category: "equipment_photos", filename: "cbct-unit.jpg", mimeType: "image/jpeg", sizeBytes: 1_220_000, daysAgo: 30 },
      { category: "documents", filename: "insurance-list.pdf", mimeType: "application/pdf", sizeBytes: 184_000, daysAgo: 30 },
    ],
    notes: [
      "Site build complete. Dr. Chen reviewed yesterday — wants the home-page tagline shortened and a different hero photo.",
    ],
    extraActivity: [
      { action: "project.created", daysAgo: 35 },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 33 },
      { action: "project.status_changed", metadata: { from: "content_collection", to: "round_1_review" }, daysAgo: 5 },
    ],
    links: {
      staging_url: "https://staging.mountainviewdental.tdo-portal.example.com",
    },
  },
  {
    organizationName: "Riverside Endodontic Specialists",
    projectName: "Riverside Endo — Full Rebuild",
    template: "Standard",
    currentMilestoneSlug: "kickoff",
    ageDays: 3,
    client: {
      email: "spatel@riversideendo.example.com",
      name: "Dr. Sarah Patel",
    },
    doneSectionSlugs: [],
    inProgressSections: [
      {
        slug: "office_details",
        content: {
          office_name: "Riverside Endodontic Specialists",
          phone: "(555) 414-2200",
        },
      },
    ],
    files: [],
    notes: [
      "Kickoff scheduled for next week. Dr. Patel sent a Google Doc — need to convert to the brief format during the call.",
    ],
    extraActivity: [
      { action: "project.created", daysAgo: 3 },
    ],
    links: {},
  },

  // ── Real projects from the Monday.com "In Dev - In Progress" group ──────
  {
    organizationName: "Chapel Hill Endodontics",
    projectName: "Dr. Andrew Rudd — Website Redesign",
    template: "Standard",
    currentMilestoneSlug: "content_collection",
    ageDays: 21,
    websiteTheme: undefined,
    client: { email: "office@chapelhillendo.example.com", name: "Dr. Andrew Rudd" },
    doneSectionSlugs: ["office_details"],
    inProgressSections: [
      { slug: "doctor_bios", content: { doctors: [{ full_name: "Dr. Andrew Rudd", credentials: "DDS, MS", bio: "", education: "", memberships: "", specialties: "", personal_interests: "" }] } },
    ],
    files: [
      { category: "logo_branding", filename: "chapel-hill-logo.png", mimeType: "image/png", sizeBytes: 64_000, daysAgo: 18 },
    ],
    notes: ["Kickoff complete. Waiting on doctor bio and photo shoot."],
    extraActivity: [
      { action: "project.created", daysAgo: 21 },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 19 },
    ],
    links: { staging_url: "https://chapelhillendo.tdosites.com", production_url: "https://chapelhillendo.com" },
    extraStaff: [{ key: "rona", role: "pm" }],
  },
  {
    organizationName: "Space Coast Endodontics",
    projectName: "Space Coast Endodontics — Website Redesign",
    template: "Standard",
    currentMilestoneSlug: "content_collection",
    ageDays: 18,
    websiteTheme: undefined,
    client: { email: "office@spacecoastendo.example.com", name: "Space Coast Endodontics" },
    doneSectionSlugs: ["office_details", "branding"],
    inProgressSections: [],
    files: [
      { category: "logo_branding", filename: "space-coast-logo.ai", mimeType: "application/postscript", sizeBytes: 245_000, daysAgo: 15 },
      { category: "office_exterior", filename: "exterior.jpg", mimeType: "image/jpeg", sizeBytes: 1_600_000, daysAgo: 14 },
    ],
    notes: ["Branding submitted. Waiting on doctor headshots and full page content."],
    extraActivity: [
      { action: "project.created", daysAgo: 18 },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 16 },
    ],
    links: { staging_url: "https://spacecoastendo.tdosites.com", production_url: "https://spacecoastendo.com" },
    extraStaff: [{ key: "rona", role: "pm" }],
  },
  {
    organizationName: "Billings Endodontics",
    projectName: "Dr. Jeffrey Beacham — Website Redesign",
    template: "Basic",
    currentMilestoneSlug: "round_1_review",
    ageDays: 42,
    websiteTheme: "Pacific Beach",
    client: { email: "office@billingsendo.example.com", name: "Dr. Jeffrey Beacham" },
    doneSectionSlugs: ["office_details", "branding", "doctor_bios", "home", "must_include", "technology"],
    inProgressSections: [],
    files: [
      { category: "logo_branding", filename: "billings-logo.svg", mimeType: "image/svg+xml", sizeBytes: 22_000, daysAgo: 40 },
      { category: "doctor_photos", filename: "dr-beacham-headshot.jpg", mimeType: "image/jpeg", sizeBytes: 910_000, daysAgo: 38 },
      { category: "office_exterior", filename: "office-front.jpg", mimeType: "image/jpeg", sizeBytes: 1_450_000, daysAgo: 38 },
    ],
    notes: ["Round 1 sent for review. Office asked for a warmer color palette — adjusting hero section."],
    extraActivity: [
      { action: "project.created", daysAgo: 42 },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 40 },
      { action: "project.status_changed", metadata: { from: "content_collection", to: "round_1_review" }, daysAgo: 7 },
    ],
    links: { staging_url: "https://billingsendo.tdosites.com", production_url: "https://billingsendo.com" },
    extraStaff: [{ key: "rona", role: "pm" }],
  },
  {
    organizationName: "850 Endodontics",
    projectName: "Dr. JT Davis — Website Redesign",
    template: "Basic",
    currentMilestoneSlug: "content_collection",
    ageDays: 12,
    websiteTheme: "Pacific Beach",
    client: { email: "office@850endo.example.com", name: "Dr. JT Davis" },
    doneSectionSlugs: ["office_details"],
    inProgressSections: [
      { slug: "doctor_bios", content: { doctors: [{ full_name: "Dr. JT Davis", credentials: "DMD, MS", bio: "", education: "", memberships: "", specialties: "", personal_interests: "" }] } },
    ],
    files: [],
    notes: ["Content collection just started. Waiting on logo files."],
    extraActivity: [
      { action: "project.created", daysAgo: 12 },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 10 },
    ],
    links: { staging_url: "https://850endo.tdosites.com", production_url: "https://850endo.com" },
    extraStaff: [{ key: "rona", role: "pm" }],
  },
  {
    organizationName: "Northern Virginia Endodontics",
    projectName: "Dr. Robert Cheron — Website Redesign",
    template: "Standard",
    currentMilestoneSlug: "content_collection",
    ageDays: 9,
    websiteTheme: "Imperial Beach",
    client: { email: "office@northernvirginiaendo.example.com", name: "Dr. Robert Cheron" },
    doneSectionSlugs: ["office_details", "branding"],
    inProgressSections: [],
    files: [
      { category: "logo_branding", filename: "nova-endo-logo.png", mimeType: "image/png", sizeBytes: 88_000, daysAgo: 7 },
    ],
    notes: ["Office submitted basic info. Full photo shoot scheduled for next week."],
    extraActivity: [
      { action: "project.created", daysAgo: 9 },
      { action: "project.status_changed", metadata: { from: "kickoff", to: "content_collection" }, daysAgo: 7 },
    ],
    links: { staging_url: "https://northernvirginiaendo.tdosites.com", production_url: "https://northernvirginiaendo.com" },
    extraStaff: [{ key: "rona", role: "pm" }],
  },
];

async function ensureOrg(name: string) {
  const existing = await db.query.organizations.findFirst({ where: eq(organizations.name, name) });
  if (existing) return existing;
  const [created] = await db.insert(organizations).values({ name }).returning();
  return created;
}

async function ensureClientUser(spec: ClientUserSpec) {
  const lower = spec.email.toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, lower) });
  if (existing) {
    if (existing.userType !== "client") {
      console.log(`  ! ${lower} already exists as ${existing.userType} — skipping`);
    }
    return existing;
  }
  const [created] = await db
    .insert(users)
    .values({ email: lower, name: spec.name, userType: "client" })
    .returning();
  return created;
}

function daysAgoDate(days: number): Date {
  return new Date(Date.now() - days * 86_400_000);
}

export async function seedDemoData({ adminUserId, templates, officeId, staffUserIds }: SeedDeps) {
  console.log("\nSeeding demo organizations + projects…");

  // Build a quick lookup of template metadata so we can snapshot.
  const templateRows = await db.query.projectTemplates.findMany();
  const templateById = new Map(templateRows.map((t) => [t.id, t]));

  for (const spec of PROJECT_SPECS) {
    const org = await ensureOrg(spec.organizationName);
    const client = await ensureClientUser(spec.client);
    const templateId = templates[spec.template].id;
    const template = templateById.get(templateId);
    if (!template) {
      console.warn(`  ! template ${spec.template} not found — skipping ${spec.projectName}`);
      continue;
    }

    // Look up or create the project (idempotent by name within org).
    let project = await db.query.projects.findFirst({
      where: and(eq(projects.organizationId, org.id), eq(projects.name, spec.projectName)),
    });

    if (!project) {
      const snapshot: ProjectTemplateSnapshot = {
        templateId: template.id,
        templateVersion: template.version,
        templateName: template.name,
        milestoneConfig: template.milestoneConfig,
        fileCategories: template.fileCategories,
        briefStructure: template.briefStructure,
        defaultSettings: template.defaultSettings,
      };
      const [created] = await db
        .insert(projects)
        .values({
          organizationId: org.id,
          templateId: template.id,
          officeId,
          name: spec.projectName,
          status: "active",
          currentMilestoneSlug: spec.currentMilestoneSlug,
          templateSnapshot: snapshot,
          links: spec.links ?? {},
          websiteTheme: spec.websiteTheme ?? null,
          createdAt: daysAgoDate(spec.ageDays),
        })
        .returning();
      project = created;
      console.log(`  + project "${spec.projectName}" created`);
    } else {
      // Keep the milestone in sync with the spec on re-seed.
      await db
        .update(projects)
        .set({ currentMilestoneSlug: spec.currentMilestoneSlug, links: spec.links ?? {} })
        .where(eq(projects.id, project.id));
      console.log(`  ✔ project "${spec.projectName}" exists — milestone synced`);
    }

    // Members — admin as owner, client as client, plus any extra staff.
    const memberRows: { projectId: string; userId: string; role: "owner" | "pm" | "designer" | "developer" | "client" }[] = [
      { projectId: project.id, userId: adminUserId, role: "owner" },
      { projectId: project.id, userId: client.id, role: "client" },
    ];
    if (staffUserIds && spec.extraStaff) {
      for (const s of spec.extraStaff) {
        const uid = staffUserIds[s.key];
        if (uid) memberRows.push({ projectId: project.id, userId: uid, role: s.role });
      }
    }
    await db.insert(projectMembers).values(memberRows).onConflictDoNothing();

    // Content briefs — done + in-progress, derived from the spec.
    for (const sectionSlug of spec.doneSectionSlugs) {
      await upsertBrief({
        projectId: project.id,
        sectionSlug,
        status: "submitted",
        content: sampleContentFor(sectionSlug, spec),
        submittedAt: daysAgoDate(Math.max(1, spec.ageDays - 5)),
        submittedByUserId: client.id,
      });
    }
    for (const ip of spec.inProgressSections) {
      await upsertBrief({
        projectId: project.id,
        sectionSlug: ip.slug,
        status: "in_progress",
        content: ip.content,
      });
    }

    // Files (no actual blobs — scan_status=clean so they show as ready in the UI).
    for (const f of spec.files) {
      const storageKey = `demo://projects/${project.id}/${f.category}/${f.filename}`;
      const existing = await db.query.files.findFirst({
        where: and(eq(files.projectId, project.id), eq(files.storageKey, storageKey)),
      });
      if (existing) continue;
      await db.insert(files).values({
        projectId: project.id,
        uploadedByUserId: client.id,
        category: f.category,
        filename: f.filename,
        storageKey,
        sizeBytes: f.sizeBytes,
        mimeType: f.mimeType,
        scanStatus: "clean",
        scanCompletedAt: daysAgoDate(f.daysAgo),
        createdAt: daysAgoDate(f.daysAgo),
      });
    }

    // Internal notes — staff-only.
    for (const noteBody of spec.notes) {
      const exists = await db.query.internalNotes.findFirst({
        where: and(eq(internalNotes.projectId, project.id), eq(internalNotes.body, noteBody)),
      });
      if (exists) continue;
      await db.insert(internalNotes).values({
        projectId: project.id,
        authorUserId: adminUserId,
        body: noteBody,
        createdAt: daysAgoDate(Math.max(1, spec.ageDays - 8)),
      });
    }

    // Activity log — derived from spec + file uploads + brief submissions.
    const desiredActivity: Array<{
      action: string;
      metadata?: Record<string, unknown>;
      createdAt: Date;
      userId: string | null;
    }> = [
      ...spec.extraActivity.map((a) => ({
        action: a.action,
        metadata: a.metadata,
        createdAt: daysAgoDate(a.daysAgo),
        userId: a.byClient ? client.id : adminUserId,
      })),
      ...spec.files.map((f) => ({
        action: "file.uploaded",
        metadata: { filename: f.filename, category: f.category },
        createdAt: daysAgoDate(f.daysAgo),
        userId: client.id,
      })),
    ];

    for (const a of desiredActivity) {
      const exists = await db.query.activityLog.findFirst({
        where: and(
          eq(activityLog.projectId, project.id),
          eq(activityLog.action, a.action),
          eq(activityLog.createdAt, a.createdAt),
        ),
      });
      if (exists) continue;
      await db.insert(activityLog).values({
        projectId: project.id,
        userId: a.userId,
        action: a.action,
        metadata: a.metadata ?? {},
        createdAt: a.createdAt,
      });
    }
  }

  console.log(`  ✔ ${PROJECT_SPECS.length} demo projects ready`);
}

async function upsertBrief(input: {
  projectId: string;
  sectionSlug: string;
  status: "not_started" | "in_progress" | "submitted" | "needs_revision" | "complete";
  content: Record<string, unknown>;
  submittedAt?: Date;
  submittedByUserId?: string;
}) {
  const existing = await db.query.contentBriefs.findFirst({
    where: and(
      eq(contentBriefs.projectId, input.projectId),
      eq(contentBriefs.sectionSlug, input.sectionSlug),
    ),
  });
  if (existing) {
    await db
      .update(contentBriefs)
      .set({
        status: input.status,
        content: input.content,
        submittedAt: input.submittedAt ?? existing.submittedAt,
        submittedByUserId: input.submittedByUserId ?? existing.submittedByUserId,
        updatedAt: new Date(),
      })
      .where(eq(contentBriefs.id, existing.id));
    return;
  }
  await db.insert(contentBriefs).values({
    projectId: input.projectId,
    sectionSlug: input.sectionSlug,
    status: input.status,
    content: input.content,
    submittedAt: input.submittedAt,
    submittedByUserId: input.submittedByUserId,
  });
}

/** Realistic-looking content for a given section, scoped to a project's identity. */
function sampleContentFor(sectionSlug: string, spec: ProjectSpec): Record<string, unknown> {
  switch (sectionSlug) {
    case "office_details":
      return {
        office_name: spec.organizationName,
        address_street: "412 Main Street",
        address_city: "Springfield",
        address_state: "IL",
        address_zip: "62701",
        phone: "(555) 412-9000",
        fax: "(555) 412-9001",
        email: "hello@example.com",
        hours: "Mon–Thu 8:00–5:00\nFri 8:00–12:00",
        after_hours_emergency: "Call our main line for after-hours emergencies.",
        contact_form_prefs: "Forward submissions to the front desk inbox.",
      };
    case "branding":
      return {
        brand_colors: "#1A9E75 (green), #0F2B3C (navy)",
        brand_fonts: "Metropolis (display), Inter (body)",
        style_notes: "Clean, modern, warm. Avoid clinical / stock-photo imagery.",
      };
    case "home":
      return {
        tagline: "Specialized endodontic care, delivered with comfort.",
        welcome_message: "We focus on one thing — saving teeth.",
        differentiators: "Modern microscopic technology\nGentleWave irrigation\nFlexible scheduling, including same-day emergencies",
        primary_cta: "Schedule a consultation",
      };
    case "must_include":
      return {
        must_include: "Mention our 6-month follow-up guarantee.",
        tone: "warm, reassuring",
      };
    case "technology":
      return {
        technologies: ["Digital radiography", "CBCT (Cone Beam CT)", "Surgical operating microscope"],
        tech_notes: "Use boilerplate descriptions for all selected technologies.",
      };
    case "doctor_bios":
      return {
        doctors: [
          {
            full_name: spec.client.name,
            credentials: "DDS, MS",
            bio: "Practicing endodontics for over a decade with a focus on patient comfort.",
            education: "DDS, University of Michigan; MS Endodontics, NYU",
            memberships: "American Association of Endodontists",
            specialties: "Microscopic endodontics, retreatment",
            personal_interests: "",
          },
        ],
      };
    default:
      return {};
  }
}
