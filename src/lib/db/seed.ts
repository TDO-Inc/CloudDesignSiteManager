/**
 * Database seed — Website Design service type with Basic + Standard templates.
 *
 * Run with: npm run db:seed
 *
 * Idempotent: re-running won't duplicate rows. Existing templates with the same
 * (service_type, name) are skipped — bump `version` and edit by hand if you
 * need to update a template that's already in the DB.
 */

import "dotenv/config";
import { eq, and } from "drizzle-orm";
import { db } from "./index";
import {
  serviceTypes,
  projectTemplates,
  offices,
  users,
} from "./schema";
import {
  websiteMilestones,
  websiteFileCategories,
  websiteDefaultSettings,
  websiteTemplates,
} from "./templates/website-design";
import { hashPassword } from "../auth/password";
import { seedDemoData } from "./demo-data";

async function ensureServiceType(name: string, slug: string) {
  const existing = await db.query.serviceTypes.findFirst({
    where: eq(serviceTypes.slug, slug),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(serviceTypes)
    .values({ name, slug, active: true })
    .returning();
  return created;
}

async function ensureOffice(name: string, slug: string) {
  const existing = await db.query.offices.findFirst({
    where: eq(offices.slug, slug),
  });
  if (existing) return existing;
  const [created] = await db
    .insert(offices)
    .values({ name, slug, active: true })
    .returning();
  return created;
}

async function ensureTemplate(
  serviceTypeId: string,
  name: string,
  description: string,
  briefStructure: typeof websiteTemplates[number]["briefStructure"],
) {
  const existing = await db.query.projectTemplates.findFirst({
    where: and(
      eq(projectTemplates.serviceTypeId, serviceTypeId),
      eq(projectTemplates.name, name),
    ),
  });
  if (existing) {
    console.log(`  ✔ template "${name}" already exists (v${existing.version}) — skipping`);
    return existing;
  }
  const [created] = await db
    .insert(projectTemplates)
    .values({
      serviceTypeId,
      name,
      description,
      milestoneConfig: websiteMilestones,
      fileCategories: websiteFileCategories,
      briefStructure,
      defaultSettings: websiteDefaultSettings,
      version: 1,
      active: true,
    })
    .returning();
  console.log(`  + template "${name}" (v1) created`);
  return created;
}

async function ensureStaffUser(email: string, name: string) {
  const lower = email.toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, lower) });
  if (existing) {
    console.log(`  ✔ staff ${lower} already exists — skipping`);
    return existing;
  }
  const [created] = await db
    .insert(users)
    .values({ email: lower, name, userType: "staff", isAdmin: false })
    .returning();
  console.log(`  + staff ${lower} created`);
  return created;
}

async function ensureAdmin(email: string, name: string, password: string) {
  const lower = email.toLowerCase();
  const existing = await db.query.users.findFirst({ where: eq(users.email, lower) });
  const passwordHash = await hashPassword(password);
  if (existing) {
    if (existing.userType !== "staff") {
      console.log(`  ! user ${lower} exists as a ${existing.userType} — skipping admin seed`);
      return existing;
    }
    await db
      .update(users)
      .set({ name, passwordHash, isAdmin: true, deactivatedAt: null })
      .where(eq(users.id, existing.id));
    console.log(`  ✔ admin ${lower} updated (password reset to seed default)`);
    return existing;
  }
  const [created] = await db
    .insert(users)
    .values({ email: lower, name, userType: "staff", passwordHash, isAdmin: true })
    .returning();
  console.log(`  + admin ${lower} created`);
  return created;
}

async function main() {
  console.log("Seeding service types…");
  const websiteDesign = await ensureServiceType("Website Design", "website-design");
  console.log(`  ✔ ${websiteDesign.name} (${websiteDesign.id})`);

  console.log("\nSeeding default office (for internal testing)…");
  const tdoInternal = await ensureOffice("TDO Internal Testing", "tdo-internal");
  console.log(`  ✔ ${tdoInternal.name} (${tdoInternal.id})`);

  console.log("\nSeeding Website Design templates…");
  const seededTemplates: Record<string, { id: string }> = {};
  for (const tpl of websiteTemplates) {
    const row = await ensureTemplate(websiteDesign.id, tpl.name, tpl.description, tpl.briefStructure);
    seededTemplates[tpl.name] = { id: row.id };
  }

  console.log("\nSeeding TDO staff users…");
  const rona   = await ensureStaffUser("rona.mahinay@tdo4endo.com",   "Rona Mahinay");
  const sean   = await ensureStaffUser("sean.doonan@tdo4endo.com",    "Sean Doonan");
  const sandra = await ensureStaffUser("sandra.kourah@tdo4endo.com",  "Sandra Kourah");
  await ensureStaffUser("megan.rapp@tdo4endo.com",      "Megan Rapp");
  await ensureStaffUser("nayeli.figueroa@tdo4endo.com", "Nayeli Figueroa");

  console.log("\nSeeding super admin user…");
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error("  ✗ ADMIN_PASSWORD is not set in .env — skipping admin seed");
    process.exit(1);
  }
  const admin = await ensureAdmin("jared.ardine@tdo4endo.com", "Jared Ardine", adminPassword);

  // Demo data — orgs, projects, briefs, files, activity. Skipped if
  // SKIP_DEMO_DATA=true (e.g. in production).
  if (process.env.SKIP_DEMO_DATA !== "true") {
    await seedDemoData({
      adminUserId: admin.id,
      templates: {
        Basic: seededTemplates["Basic"],
        Standard: seededTemplates["Standard"],
      },
      officeId: tdoInternal.id,
      staffUserIds: {
        rona: rona.id,
        sean: sean.id,
        sandra: sandra.id,
      },
    });
  } else {
    console.log("\nSKIP_DEMO_DATA=true → skipping demo orgs/projects/briefs");
  }

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
