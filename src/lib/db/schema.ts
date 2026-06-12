import { relations, sql } from "drizzle-orm";
import {
  mssqlTable,
  nvarchar,
  bit,
  int,
  bigint,
  datetimeOffset,
  primaryKey,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/mssql-core";

/* ------------------------------------------------------------------ */
/* Custom column helpers                                              */
/* ------------------------------------------------------------------ */

// SQL Server UNIQUEIDENTIFIER column (UUID equivalent).
// toDriver/fromDriver normalize to lowercase so app-level comparisons work correctly
// (SQL Server's mssql driver returns GUIDs as uppercase strings).
const uniqueidentifier = customType<{ data: string; driverData: string }>({
  dataType() { return "uniqueidentifier"; },
  toDriver(value: string): string { return value.toLowerCase(); },
  fromDriver(value: string): string { return value.toLowerCase(); },
});

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
  id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
  name: nvarchar("name", { length: "max" }).notNull(),
  slug: nvarchar("slug", { length: 255 }).notNull().unique(),
  active: bit("active").notNull().default(true),
  createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
});

export const projectTemplates = mssqlTable(
  "project_templates",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
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
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("project_templates_service_type_idx").on(table.serviceTypeId),
  ],
);

export const offices = mssqlTable("offices", {
  id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
  name: nvarchar("name", { length: "max" }).notNull(),
  slug: nvarchar("slug", { length: 255 }).notNull().unique(),
  active: bit("active").notNull().default(true),
  createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
});

export const organizations = mssqlTable("organizations", {
  id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
  name: nvarchar("name", { length: "max" }).notNull(),
  hubspotCompanyId: nvarchar("hubspot_company_id", { length: 255 }),
  createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
});

/* ------------------------------------------------------------------ */
/* Users & auth                                                       */
/* ------------------------------------------------------------------ */

export const users = mssqlTable("users", {
  id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
  email: nvarchar("email", { length: 255 }).notNull().unique(),
  name: nvarchar("name", { length: 255 }).notNull(),
  userType: nvarchar("user_type", { length: 10 }).notNull().$type<UserType>(),
  passwordHash: nvarchar("password_hash", { length: "max" }),
  isAdmin: bit("is_admin").notNull().default(false),
  deactivatedAt: datetimeOffset("deactivated_at"),
  lastLoginAt: datetimeOffset("last_login_at"),
  createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
});

export const magicLinks = mssqlTable(
  "magic_links",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
    userId: uniqueidentifier("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: nvarchar("token_hash", { length: 255 }).notNull(),
    expiresAt: datetimeOffset("expires_at").notNull(),
    usedAt: datetimeOffset("used_at"),
    requestedIp: nvarchar("requested_ip", { length: 45 }),
    userAgent: nvarchar("user_agent", { length: "max" }),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    uniqueIndex("magic_links_token_hash_idx").on(table.tokenHash),
    index("magic_links_user_idx").on(table.userId),
  ],
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
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
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
    launchedAt: datetimeOffset("launched_at"),
    archivedAt: datetimeOffset("archived_at"),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("projects_organization_idx").on(table.organizationId),
    index("projects_office_idx").on(table.officeId),
    index("projects_status_idx").on(table.status),
  ],
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
    addedAt: datetimeOffset("added_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.userId] }),
    index("project_members_user_idx").on(table.userId),
  ],
);

/* ------------------------------------------------------------------ */
/* Content briefs & files                                             */
/* ------------------------------------------------------------------ */

export type BriefContent = Record<string, unknown>;

export const contentBriefs = mssqlTable(
  "content_briefs",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
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
    submittedAt: datetimeOffset("submitted_at"),
    submittedByUserId: uniqueidentifier("submitted_by_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    updatedAt: datetimeOffset("updated_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    uniqueIndex("content_briefs_project_section_idx").on(
      table.projectId,
      table.sectionSlug,
    ),
  ],
);

export const files = mssqlTable(
  "files",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
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
    scanCompletedAt: datetimeOffset("scan_completed_at"),
    scanDetails: jsonMssql<Record<string, unknown>>("scan_details"),
    supersededById: uniqueidentifier("superseded_by_id"),
    isFinal: bit("is_final").notNull().default(false),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("files_project_category_idx").on(table.projectId, table.category),
    index("files_scan_status_idx").on(table.scanStatus),
  ],
);

/* ------------------------------------------------------------------ */
/* Notes, activity, audit, email                                      */
/* ------------------------------------------------------------------ */

export const internalNotes = mssqlTable(
  "internal_notes",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorUserId: uniqueidentifier("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: nvarchar("body", { length: "max" }).notNull(),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("internal_notes_project_idx").on(table.projectId),
  ],
);

export const activityLog = mssqlTable(
  "activity_log",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
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
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("activity_log_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
  ],
);

export const auditLog = mssqlTable(
  "audit_log",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
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
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("audit_log_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const emailDeliveryLog = mssqlTable(
  "email_delivery_log",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
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
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("email_delivery_log_project_idx").on(table.projectId),
    index("email_delivery_log_status_idx").on(table.status),
  ],
);

/* ------------------------------------------------------------------ */
/* Messaging                                                          */
/* ------------------------------------------------------------------ */

export const projectMessages = mssqlTable(
  "project_messages",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
    projectId: uniqueidentifier("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uniqueidentifier("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: nvarchar("body", { length: "max" }).notNull(),
    isFromStaff: bit("is_from_staff").notNull().default(false),
    readAt: datetimeOffset("read_at"),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("project_messages_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
    index("project_messages_unread_idx").on(
      table.projectId,
      table.isFromStaff,
      table.readAt,
    ),
  ],
);

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export const notifications = mssqlTable(
  "notifications",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
    userId: uniqueidentifier("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uniqueidentifier("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    type: nvarchar("type", { length: 30 }).notNull().$type<NotificationType>(),
    body: nvarchar("body", { length: "max" }).notNull(),
    linkHref: nvarchar("link_href", { length: 500 }),
    readAt: datetimeOffset("read_at"),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("notifications_user_created_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
  ],
);

export const kbArticles = mssqlTable(
  "kb_articles",
  {
    id: uniqueidentifier("id").primaryKey().default(sql`NEWID()`),
    title: nvarchar("title", { length: 500 }).notNull(),
    content: nvarchar("content", { length: "max" }).notNull(),
    category: nvarchar("category", { length: 100 }).notNull().default("general"),
    tags: stringArrayMssql("tags"),
    active: bit("active").notNull().default(true),
    createdByUserId: uniqueidentifier("created_by_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    updatedAt: datetimeOffset("updated_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
    createdAt: datetimeOffset("created_at").notNull().default(sql`SYSDATETIMEOFFSET()`),
  },
  (table) => [
    index("kb_articles_category_idx").on(table.category),
    index("kb_articles_active_idx").on(table.active),
  ],
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
