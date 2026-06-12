# Azure SQL DB Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate TDO Client Portal from PostgreSQL (`drizzle-orm/pg-core` + `postgres-js`) to Azure SQL Database (`drizzle-orm/mssql-core` + `mssql`) with no changes to query logic.

**Architecture:** Replace the pg-core schema dialect with mssql-core throughout `schema.ts`, using a custom `jsonMssql<T>()` helper to preserve transparent JSON serialization for all jsonb columns. Swap the `postgres-js` driver for `node-mssql` in `db/index.ts`. The only query-layer change is `kb-search.ts`, which replaces PostgreSQL `tsvector/tsquery` with SQL Server `CONTAINSTABLE`. No Drizzle ORM query calls (select/insert/update/delete) require modification.

**Tech Stack:** Next.js 15, Drizzle ORM 0.36+, Drizzle Kit 0.30+, `mssql` (node-mssql / Tedious driver), Azure SQL Database

---

> **Before starting:** Skim the current [Drizzle SQL Server docs](https://orm.drizzle.team/docs/get-started/sqlserver-new) to confirm:
> - The correct driver import path (shown here as `"drizzle-orm/mssql"` — may be `"drizzle-orm/node-mssql"`)
> - The correct drizzle-kit `dialect` value and `dbCredentials` shape for mssql
> - Whether `bigint` in mssql-core accepts `{ mode: "number" }` (if TypeScript errors on that option, remove it)
>
> These are the only spots where the Drizzle mssql-core API may differ from what's written here.

---

## File Map

| File | Action |
|---|---|
| `package.json` | Remove `postgres`, add `mssql` |
| `src/lib/db/schema.ts` | Full rewrite — pg-core → mssql-core |
| `drizzle.config.ts` | Change dialect + connection format |
| `src/lib/db/index.ts` | Full rewrite — postgres-js driver → mssql driver |
| `.env.example` | Update `DATABASE_URL` format |
| `src/lib/ai/kb-search.ts` | Rewrite FTS query — tsvector → CONTAINSTABLE |
| `drizzle/` | Generate T-SQL migrations, then manually append FTS setup |

---

### Task 1: Swap database drivers

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Uninstall postgres, install mssql**

```bash
npm uninstall postgres
npm install mssql
npm install --save-dev @types/mssql
```

- [ ] **Step 2: Verify installation**

```bash
npm ls mssql
```

Expected: `mssql@10.x.x` (or current) in the dependency tree with no errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: swap postgres driver for mssql"
```

---

### Task 2: Rewrite schema.ts

**Files:**
- Rewrite: `src/lib/db/schema.ts`

This is a complete file replacement. Key changes:
- All imports switch from `drizzle-orm/pg-core` to `drizzle-orm/mssql-core`
- Seven `pgEnum` declarations removed; replaced with exported TypeScript union types
- Two custom helpers (`jsonMssql<T>`, `stringArrayMssql`) replace `jsonb` and `text().array()`
- All column types translated (see mapping in design spec)
- Relations section is unchanged (dialect-agnostic)

- [ ] **Step 1: Replace src/lib/db/schema.ts with the following**

```typescript
import { relations } from "drizzle-orm";
import {
  mssqlTable,
  uniqueidentifier,
  nvarchar,
  bit,
  int,
  bigint,
  datetimeoffset,
  primaryKey,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/mssql-core";

/* ------------------------------------------------------------------ */
/* Custom column helpers                                              */
/* ------------------------------------------------------------------ */

// Stores typed JSON as nvarchar(max) with automatic serialization.
function jsonMssql<TData>(name: string) {
  return customType<{ data: TData; driverData: string }>({
    dataType() { return "nvarchar(max)"; },
    toDriver(value: TData): string { return JSON.stringify(value); },
    fromDriver(value: string): TData { return JSON.parse(value) as TData; },
  })(name);
}

// Stores string[] as a JSON array in nvarchar(max).
function stringArrayMssql(name: string) {
  return customType<{ data: string[]; driverData: string }>({
    dataType() { return "nvarchar(max)"; },
    toDriver(value: string[]): string { return JSON.stringify(value); },
    fromDriver(value: string): string[] {
      try { return JSON.parse(value) as string[]; }
      catch { return []; }
    },
  })(name);
}

/* ------------------------------------------------------------------ */
/* TypeScript unions (replace pgEnum — no DB-level enum type in MSSQL) */
/* ------------------------------------------------------------------ */

export type UserType = "staff" | "client";
export type ProjectMemberRole = "owner" | "pm" | "designer" | "developer" | "client";
export type ProjectStatus = "active" | "archived" | "cancelled";
export type FileScanStatus = "pending" | "clean" | "infected" | "error";
export type ContentBriefStatus =
  | "not_started"
  | "in_progress"
  | "submitted"
  | "needs_revision"
  | "complete";
export type EmailStatus = "queued" | "sent" | "delivered" | "bounced" | "failed";
export type NotificationType =
  | "revision_requested"
  | "message_received"
  | "preview_ready"
  | "milestone_changed"
  | "brief_submitted";

/* ------------------------------------------------------------------ */
/* Reference data                                                     */
/* ------------------------------------------------------------------ */

export type MilestoneConfig = {
  milestones: Array<{
    slug: string;
    label: string;
    description?: string;
    order: number;
    badge_color?: string;
  }>;
};

export type FileCategoryConfig = {
  categories: Array<{
    slug: string;
    label: string;
    description?: string;
    accept?: string[];
    multiple?: boolean;
  }>;
};

export type BriefFieldType =
  | "short_text"
  | "long_text"
  | "rich_text"
  | "url"
  | "email"
  | "phone"
  | "image"
  | "file"
  | "checkbox_list"
  | "select"
  | "structured_list";

export type BriefField = {
  key: string;
  label: string;
  type: BriefFieldType;
  required?: boolean;
  help?: string;
  options?: string[];
  itemSchema?: BriefField[];
};

export type BriefSection = {
  slug: string;
  label: string;
  description?: string;
  icon?: string;
  required?: boolean;
  fields: BriefField[];
};

export type BriefStructure = {
  sections: BriefSection[];
};

export type TemplateDefaultSettings = {
  links?: Array<{ key: string; label: string; required?: boolean }>;
  reminderDays?: number;
};

export const serviceTypes = mssqlTable("service_types", {
  id: uniqueidentifier("id").primaryKey().defaultRandom(),
  name: nvarchar("name", { length: "max" }).notNull(),
  slug: nvarchar("slug", { length: 255 }).notNull().unique(),
  active: bit("active").notNull().default(true),
  createdAt: datetimeoffset("created_at").notNull().defaultNow(),
});

export const projectTemplates = mssqlTable(
  "project_templates",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    serviceTypeId: uniqueidentifier("service_type_id")
      .notNull()
      .references(() => serviceTypes.id, { onDelete: "restrict" }),
    name: nvarchar("name", { length: "max" }).notNull(),
    description: nvarchar("description", { length: "max" }),
    milestoneConfig: jsonMssql<MilestoneConfig>("milestone_config").notNull(),
    fileCategories: jsonMssql<FileCategoryConfig>("file_categories").notNull(),
    briefStructure: jsonMssql<BriefStructure>("brief_structure").notNull(),
    defaultSettings: jsonMssql<TemplateDefaultSettings>("default_settings")
      .notNull()
      .default({} as TemplateDefaultSettings),
    version: int("version").notNull().default(1),
    active: bit("active").notNull().default(true),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    serviceTypeIdx: index("project_templates_service_type_idx").on(
      table.serviceTypeId,
    ),
  }),
);

export const offices = mssqlTable("offices", {
  id: uniqueidentifier("id").primaryKey().defaultRandom(),
  name: nvarchar("name", { length: "max" }).notNull(),
  slug: nvarchar("slug", { length: 255 }).notNull().unique(),
  active: bit("active").notNull().default(true),
  createdAt: datetimeoffset("created_at").notNull().defaultNow(),
});

export const organizations = mssqlTable("organizations", {
  id: uniqueidentifier("id").primaryKey().defaultRandom(),
  name: nvarchar("name", { length: "max" }).notNull(),
  hubspotCompanyId: nvarchar("hubspot_company_id", { length: 255 }),
  createdAt: datetimeoffset("created_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Users & auth                                                       */
/* ------------------------------------------------------------------ */

export const users = mssqlTable("users", {
  id: uniqueidentifier("id").primaryKey().defaultRandom(),
  email: nvarchar("email", { length: 255 }).notNull().unique(),
  name: nvarchar("name", { length: 255 }).notNull(),
  userType: nvarchar("user_type", { length: 10 }).notNull().$type<UserType>(),
  passwordHash: nvarchar("password_hash", { length: "max" }),
  isAdmin: bit("is_admin").notNull().default(false),
  deactivatedAt: datetimeoffset("deactivated_at"),
  lastLoginAt: datetimeoffset("last_login_at"),
  createdAt: datetimeoffset("created_at").notNull().defaultNow(),
});

export const magicLinks = mssqlTable(
  "magic_links",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    userId: uniqueidentifier("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: nvarchar("token_hash", { length: 255 }).notNull(),
    expiresAt: datetimeoffset("expires_at").notNull(),
    usedAt: datetimeoffset("used_at"),
    requestedIp: nvarchar("requested_ip", { length: 45 }),
    userAgent: nvarchar("user_agent", { length: "max" }),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("magic_links_token_hash_idx").on(table.tokenHash),
    userIdx: index("magic_links_user_idx").on(table.userId),
  }),
);

/* ------------------------------------------------------------------ */
/* Projects                                                           */
/* ------------------------------------------------------------------ */

export type ProjectTemplateSnapshot = {
  templateId: string;
  templateVersion: number;
  templateName: string;
  milestoneConfig: MilestoneConfig;
  fileCategories: FileCategoryConfig;
  briefStructure: BriefStructure;
  defaultSettings: TemplateDefaultSettings;
};

export type ProjectLinks = Record<string, string>;

export const projects = mssqlTable(
  "projects",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    organizationId: uniqueidentifier("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    templateId: uniqueidentifier("template_id")
      .notNull()
      .references(() => projectTemplates.id, { onDelete: "restrict" }),
    officeId: uniqueidentifier("office_id")
      .notNull()
      .references(() => offices.id, { onDelete: "restrict" }),
    name: nvarchar("name", { length: "max" }).notNull(),
    status: nvarchar("status", { length: 20 })
      .notNull()
      .default("active")
      .$type<ProjectStatus>(),
    currentMilestoneSlug: nvarchar("current_milestone_slug", { length: 255 }),
    templateSnapshot: jsonMssql<ProjectTemplateSnapshot>("template_snapshot").notNull(),
    links: jsonMssql<ProjectLinks>("links").notNull().default({} as ProjectLinks),
    websiteTheme: nvarchar("website_theme", { length: 255 }),
    hubspotDealId: nvarchar("hubspot_deal_id", { length: 255 }),
    mondayBoardId: nvarchar("monday_board_id", { length: 255 }),
    mondayItemId: nvarchar("monday_item_id", { length: 255 }),
    launchedAt: datetimeoffset("launched_at"),
    archivedAt: datetimeoffset("archived_at"),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    organizationIdx: index("projects_organization_idx").on(table.organizationId),
    officeIdx: index("projects_office_idx").on(table.officeId),
    statusIdx: index("projects_status_idx").on(table.status),
  }),
);

export const projectMembers = mssqlTable(
  "project_members",
  {
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uniqueidentifier("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: nvarchar("role", { length: 20 }).notNull().$type<ProjectMemberRole>(),
    addedAt: datetimeoffset("added_at").notNull().defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.userId] }),
    userIdx: index("project_members_user_idx").on(table.userId),
  }),
);

/* ------------------------------------------------------------------ */
/* Content briefs & files                                             */
/* ------------------------------------------------------------------ */

export type BriefContent = Record<string, unknown>;

export const contentBriefs = mssqlTable(
  "content_briefs",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sectionSlug: nvarchar("section_slug", { length: 255 }).notNull(),
    status: nvarchar("status", { length: 20 })
      .notNull()
      .default("not_started")
      .$type<ContentBriefStatus>(),
    content: jsonMssql<BriefContent>("content").notNull().default({} as BriefContent),
    revisionNote: nvarchar("revision_note", { length: "max" }),
    submittedAt: datetimeoffset("submitted_at"),
    submittedByUserId: uniqueidentifier("submitted_by_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    updatedAt: datetimeoffset("updated_at").notNull().defaultNow(),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectSectionIdx: uniqueIndex("content_briefs_project_section_idx").on(
      table.projectId,
      table.sectionSlug,
    ),
  }),
);

export const files = mssqlTable(
  "files",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    uploadedByUserId: uniqueidentifier("uploaded_by_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    category: nvarchar("category", { length: 255 }).notNull(),
    filename: nvarchar("filename", { length: 500 }).notNull(),
    storageKey: nvarchar("storage_key", { length: 500 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    mimeType: nvarchar("mime_type", { length: 255 }).notNull(),
    scanStatus: nvarchar("scan_status", { length: 20 })
      .notNull()
      .default("pending")
      .$type<FileScanStatus>(),
    scanCompletedAt: datetimeoffset("scan_completed_at"),
    scanDetails: jsonMssql<Record<string, unknown>>("scan_details"),
    supersededById: uniqueidentifier("superseded_by_id"),
    isFinal: bit("is_final").notNull().default(false),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectCategoryIdx: index("files_project_category_idx").on(
      table.projectId,
      table.category,
    ),
    scanStatusIdx: index("files_scan_status_idx").on(table.scanStatus),
  }),
);

/* ------------------------------------------------------------------ */
/* Notes, activity, audit, email                                      */
/* ------------------------------------------------------------------ */

export const internalNotes = mssqlTable(
  "internal_notes",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorUserId: uniqueidentifier("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: nvarchar("body", { length: "max" }).notNull(),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("internal_notes_project_idx").on(table.projectId),
  }),
);

export const activityLog = mssqlTable(
  "activity_log",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uniqueidentifier("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: nvarchar("action", { length: 255 }).notNull(),
    metadata: jsonMssql<Record<string, unknown>>("metadata").default(
      {} as Record<string, unknown>,
    ),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectCreatedIdx: index("activity_log_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
  }),
);

export const auditLog = mssqlTable(
  "audit_log",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    userId: uniqueidentifier("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: nvarchar("action", { length: 255 }).notNull(),
    targetType: nvarchar("target_type", { length: 100 }),
    targetId: nvarchar("target_id", { length: 255 }),
    ipAddress: nvarchar("ip_address", { length: 45 }),
    userAgent: nvarchar("user_agent", { length: "max" }),
    metadata: jsonMssql<Record<string, unknown>>("metadata").default(
      {} as Record<string, unknown>,
    ),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("audit_log_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const emailDeliveryLog = mssqlTable(
  "email_delivery_log",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    toEmail: nvarchar("to_email", { length: 255 }).notNull(),
    fromEmail: nvarchar("from_email", { length: 255 }).notNull(),
    subject: nvarchar("subject", { length: 500 }).notNull(),
    template: nvarchar("template", { length: 100 }).notNull(),
    projectId: uniqueidentifier("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    userId: uniqueidentifier("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    providerMessageId: nvarchar("provider_message_id", { length: 255 }),
    status: nvarchar("status", { length: 20 })
      .notNull()
      .default("queued")
      .$type<EmailStatus>(),
    error: nvarchar("error", { length: "max" }),
    metadata: jsonMssql<Record<string, unknown>>("metadata").default(
      {} as Record<string, unknown>,
    ),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectIdx: index("email_delivery_log_project_idx").on(table.projectId),
    statusIdx: index("email_delivery_log_status_idx").on(table.status),
  }),
);

/* ------------------------------------------------------------------ */
/* Messaging                                                          */
/* ------------------------------------------------------------------ */

export const projectMessages = mssqlTable(
  "project_messages",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uniqueidentifier("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: nvarchar("body", { length: "max" }).notNull(),
    isFromStaff: bit("is_from_staff").notNull().default(false),
    readAt: datetimeoffset("read_at"),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    projectCreatedIdx: index("project_messages_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
    unreadIdx: index("project_messages_unread_idx").on(
      table.projectId,
      table.isFromStaff,
      table.readAt,
    ),
  }),
);

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export const notifications = mssqlTable(
  "notifications",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    userId: uniqueidentifier("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uniqueidentifier("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    type: nvarchar("type", { length: 30 }).notNull().$type<NotificationType>(),
    body: nvarchar("body", { length: "max" }).notNull(),
    linkHref: nvarchar("link_href", { length: 500 }),
    readAt: datetimeoffset("read_at"),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("notifications_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
    userUnreadIdx: index("notifications_user_unread_idx").on(
      table.userId,
      table.readAt,
    ),
  }),
);

export const kbArticles = mssqlTable(
  "kb_articles",
  {
    id: uniqueidentifier("id").primaryKey().defaultRandom(),
    title: nvarchar("title", { length: 500 }).notNull(),
    content: nvarchar("content", { length: "max" }).notNull(),
    category: nvarchar("category", { length: 100 }).notNull().default("general"),
    tags: stringArrayMssql("tags"),
    active: bit("active").notNull().default(true),
    createdByUserId: uniqueidentifier("created_by_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    updatedAt: datetimeoffset("updated_at").notNull().defaultNow(),
    createdAt: datetimeoffset("created_at").notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("kb_articles_category_idx").on(table.category),
    activeIdx: index("kb_articles_active_idx").on(table.active),
  }),
);

/* ------------------------------------------------------------------ */
/* Relations (dialect-agnostic — unchanged from original)            */
/* ------------------------------------------------------------------ */

export const serviceTypesRelations = relations(serviceTypes, ({ many }) => ({
  templates: many(projectTemplates),
}));

export const projectTemplatesRelations = relations(
  projectTemplates,
  ({ one, many }) => ({
    serviceType: one(serviceTypes, {
      fields: [projectTemplates.serviceTypeId],
      references: [serviceTypes.id],
    }),
    projects: many(projects),
  }),
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  projects: many(projects),
}));

export const officesRelations = relations(offices, ({ many }) => ({
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  template: one(projectTemplates, {
    fields: [projects.templateId],
    references: [projectTemplates.id],
  }),
  office: one(offices, {
    fields: [projects.officeId],
    references: [offices.id],
  }),
  members: many(projectMembers),
  files: many(files),
  briefs: many(contentBriefs),
  notes: many(internalNotes),
  activity: many(activityLog),
  messages: many(projectMessages),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, {
    fields: [projectMembers.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMembers.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(projectMembers),
  magicLinks: many(magicLinks),
}));

export const contentBriefsRelations = relations(contentBriefs, ({ one }) => ({
  project: one(projects, {
    fields: [contentBriefs.projectId],
    references: [projects.id],
  }),
}));

export const filesRelations = relations(files, ({ one }) => ({
  project: one(projects, {
    fields: [files.projectId],
    references: [projects.id],
  }),
  uploadedBy: one(users, {
    fields: [files.uploadedByUserId],
    references: [users.id],
  }),
}));

export const kbArticlesRelations = relations(kbArticles, ({ one }) => ({
  createdBy: one(users, {
    fields: [kbArticles.createdByUserId],
    references: [users.id],
  }),
}));

export const projectMessagesRelations = relations(projectMessages, ({ one }) => ({
  project: one(projects, {
    fields: [projectMessages.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectMessages.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [notifications.projectId],
    references: [projects.id],
  }),
}));
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/schema.ts
git commit -m "feat: rewrite schema for mssql-core dialect"
```

---

### Task 3: Update drizzle.config.ts

**Files:**
- Modify: `drizzle.config.ts`

> **Verify:** Check current Drizzle Kit docs for the exact `dbCredentials` shape for the mssql dialect — it may use `connection` instead of `url`.

- [ ] **Step 1: Replace drizzle.config.ts with the following**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "mssql",
  dbCredentials: {
    url: process.env.DATABASE_URL ??
      "Server=localhost,1433;Database=tdo_portal;User Id=sa;Password=YourPassword!;Encrypt=False;TrustServerCertificate=True;",
  },
  strict: true,
  verbose: true,
});
```

- [ ] **Step 2: Commit**

```bash
git add drizzle.config.ts
git commit -m "chore: update drizzle config for mssql dialect"
```

---

### Task 4: Rewrite src/lib/db/index.ts

**Files:**
- Rewrite: `src/lib/db/index.ts`

> **Verify:** Confirm the correct import path for the Drizzle mssql adapter. It is shown here as `"drizzle-orm/mssql"` but may be `"drizzle-orm/node-mssql"`. Check the Drizzle docs.
>
> **Connection timing:** `pool.connect()` is async. The implementation fires-and-forgets it because node-mssql queues incoming requests until the pool is ready. If you see connection-before-ready errors in testing, change the fire-and-forget call to `await pool.connect()` at module initialization.

- [ ] **Step 1: Replace src/lib/db/index.ts with the following**

```typescript
import mssql from "mssql";
import { drizzle } from "drizzle-orm/mssql"; // verify: may be "drizzle-orm/node-mssql"
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  // eslint-disable-next-line no-var
  var __msPool: mssql.ConnectionPool | undefined;
  // eslint-disable-next-line no-var
  var __dbInstance: DbInstance | undefined;
}

function getDb(): DbInstance {
  if (global.__dbInstance) return global.__dbInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!global.__msPool) {
    const pool = new mssql.ConnectionPool(connectionString);
    // Start connecting; mssql queues requests until the pool is ready.
    pool.connect().catch((err: Error) => {
      console.error("[db] connection pool error", err);
    });
    global.__msPool = pool;
  }

  const instance = drizzle(global.__msPool, { schema });
  global.__dbInstance = instance;
  return instance;
}

export const db: DbInstance = new Proxy({} as DbInstance, {
  get(_t, prop) {
    const real = getDb();
    const value = (real as never as Record<PropertyKey, unknown>)[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(real);
    }
    return value;
  },
});

export function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL;
}

export { schema };
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/db/index.ts
git commit -m "feat: swap postgres-js driver for mssql in db/index.ts"
```

---

### Task 5: Update environment variable references

**Files:**
- Modify: `.env.example`
- No changes to `.github/workflows/deploy.yml` (structure is unchanged; `DATABASE_URL` is already passed as a secret)
- **Services manager action required:** After deploying, update the `DATABASE_URL` value in:
  - GitHub environment secret (`Settings → Environments → production → DATABASE_URL`)
  - Azure App Service Application Settings (`DATABASE_URL`)
  Both should use the SQL Server connection string format shown below.

### Task 5: Update .env.example

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: Update the DATABASE_URL line in .env.example**

Replace:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tdo_portal
```

With:
```
DATABASE_URL=Server=localhost,1433;Database=tdo_portal;User Id=sa;Password=YourPassword!;Encrypt=False;TrustServerCertificate=True;
```

Leave all other lines unchanged.

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: update DATABASE_URL example for SQL Server format"
```

---

> **Note on tags handling:** The design spec called for manual `JSON.stringify`/`JSON.parse` wrappers in `seed-kb.ts`, `kb/route.ts`, and `kb/[articleId]/route.ts`. This plan uses the `stringArrayMssql` custom column type instead, which handles serialization transparently at the ORM layer. Those three files need **no changes**.

### Task 6: Rewrite kb-search.ts

**Files:**
- Rewrite: `src/lib/ai/kb-search.ts`

Replaces PostgreSQL `tsvector`/`tsquery` full-text search with SQL Server `CONTAINSTABLE`. The FTS catalog and index this query depends on are created in Task 8.

- [ ] **Step 1: Replace src/lib/ai/kb-search.ts with the following**

```typescript
/**
 * Knowledge base full-text search.
 *
 * Uses SQL Server CONTAINSTABLE for ranked full-text retrieval.
 * Requires a full-text catalog and index on kb_articles(title, content) —
 * created in the initial Drizzle migration (see drizzle/ folder, Task 8).
 * Falls back to an empty array if the DB is unavailable or the query is empty.
 */

import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type KbArticle = {
  id: string;
  title: string;
  content: string;
  category: string;
};

export async function searchKb(query: string, limit = 4): Promise<KbArticle[]> {
  const q = query.trim();
  if (!q) return [];

  try {
    const rows = await db.execute(sql`
      SELECT TOP (${limit}) k.id, k.title, k.content, k.category
      FROM kb_articles k
      INNER JOIN CONTAINSTABLE(kb_articles, (title, content), ${q}) ct
        ON k.id = ct.[KEY]
      WHERE k.active = 1
      ORDER BY ct.[RANK] DESC
    `);
    return Array.from(rows) as KbArticle[];
  } catch (err) {
    console.warn("[kb-search] search failed", err);
    return [];
  }
}

export function formatKbContext(articles: KbArticle[]): string {
  if (articles.length === 0) return "";
  const sections = articles
    .map((a) => `### ${a.title}\n${a.content}`)
    .join("\n\n");
  return `\n\n---\n## Relevant knowledge base articles\n\n${sections}`;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ai/kb-search.ts
git commit -m "feat: replace postgres tsvector search with CONTAINSTABLE for SQL Server"
```

---

### Task 7: Run typecheck and fix any issues

**Files:** None predetermined — depends on what TypeScript reports.

- [ ] **Step 1: Run the typecheck**

```bash
npm run typecheck
```

- [ ] **Step 2: Fix any errors**

Common issues and resolutions:

**`bigint` does not accept `{ mode: "number" }`**
If TypeScript errors on `bigint("size_bytes", { mode: "number" })`, remove the options object:
```typescript
sizeBytes: bigint("size_bytes").notNull(),
```
The column will return a `number` from node-mssql by default for BIGINT values in the typical file-size range.

**Unknown import path for drizzle mssql adapter**
If `import { drizzle } from "drizzle-orm/mssql"` errors, change to `"drizzle-orm/node-mssql"` in `src/lib/db/index.ts`.

**`nvarchar` options shape differs**
If `{ length: "max" }` errors, try `{ length: 8000 }` as a fallback, or check the mssql-core docs for the max-length syntax.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Fix any lint errors reported.

- [ ] **Step 4: Run tests**

```bash
npm run test
```

Expected: all existing tests pass (password hashing, `cn`, email templates, and template config tests are dialect-agnostic).

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve typecheck issues after mssql-core migration"
```

---

### Task 8: Generate migrations and add full-text search setup

**Files:**
- Generate: `drizzle/` (Drizzle Kit output)

> **Prerequisite:** `DATABASE_URL` must point at a reachable Azure SQL DB instance (or a local SQL Server via Docker: `docker run -e ACCEPT_EULA=Y -e SA_PASSWORD=YourPassword! -p 1433:1433 mcr.microsoft.com/mssql/server:2022-latest`).

- [ ] **Step 1: Generate T-SQL migrations**

```bash
npm run db:generate
```

Expected: one or more `.sql` files appear in the `drizzle/` folder.

- [ ] **Step 2: Find the kb_articles primary key constraint name**

Open the generated migration file in `drizzle/`. Find the `CREATE TABLE [kb_articles]` statement and locate the `PRIMARY KEY` constraint name. It will look similar to:

```sql
CONSTRAINT [kb_articles_id_pk] PRIMARY KEY ([id])
```

Copy that constraint name (e.g. `kb_articles_id_pk`).

- [ ] **Step 3: Append the full-text search setup to the migration file**

At the end of the generated migration `.sql` file, append:

```sql
-- Full-text search setup for KB article search
CREATE FULLTEXT CATALOG kb_ft_catalog AS DEFAULT;

CREATE FULLTEXT INDEX ON kb_articles(title LANGUAGE 1033, content LANGUAGE 1033)
  KEY INDEX [kb_articles_id_pk]   -- replace with actual PK constraint name from Step 2
  ON kb_ft_catalog
  WITH CHANGE_TRACKING AUTO;
```

Replace `[kb_articles_id_pk]` with the actual constraint name you found in Step 2.

- [ ] **Step 4: Apply migrations**

```bash
npm run db:migrate
```

Expected: the migration runs without errors and all tables are created.

- [ ] **Step 5: Seed the database**

```bash
npm run db:seed
npm run db:seed-kb
```

Expected: reference data, demo project, and KB articles are inserted.

- [ ] **Step 6: Commit migration files**

```bash
git add drizzle/
git commit -m "chore: add initial mssql migration with full-text search setup"
```

---

### Task 9: Verify end-to-end and final commit

- [ ] **Step 1: Start the dev server**

Ensure `DATABASE_URL` in your local `.env` points at a running SQL Server instance, then:

```bash
npm run dev
```

- [ ] **Step 2: Smoke-test the following flows**

- Sign in as staff → project list loads (confirms DB connection + JSON deserialization for `templateSnapshot`)
- Open a project → briefs and files tabs load (confirms `jsonb` content columns)
- Open KB admin → list KB articles, create one, edit it (confirms tags round-trip as string[])
- Use the AI assistant with a search query → confirm `searchKb` returns results (confirms CONTAINSTABLE)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: complete Azure SQL DB migration"
```
