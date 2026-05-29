import { relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  bigint,
  timestamp,
  jsonb,
  pgEnum,
  primaryKey,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                              */
/* ------------------------------------------------------------------ */

export const userTypeEnum = pgEnum("user_type", ["staff", "client"]);

export const projectMemberRoleEnum = pgEnum("project_member_role", [
  "owner",
  "pm",
  "designer",
  "developer",
  "client",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "active",
  "archived",
  "cancelled",
]);

export const fileScanStatusEnum = pgEnum("file_scan_status", [
  "pending",
  "clean",
  "infected",
  "error",
]);

export const contentBriefStatusEnum = pgEnum("content_brief_status", [
  "not_started",
  "in_progress",
  "submitted",
  "needs_revision",
  "complete",
]);

export const emailStatusEnum = pgEnum("email_status", [
  "queued",
  "sent",
  "delivered",
  "bounced",
  "failed",
]);

/* ------------------------------------------------------------------ */
/* Reference data                                                     */
/* ------------------------------------------------------------------ */

export const serviceTypes = pgTable("service_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Template configuration shapes — encoded in jsonb so we can add service types
 * (SEO, Marketing, etc.) without schema migrations.
 */
export type MilestoneConfig = {
  milestones: Array<{
    slug: string;
    label: string;
    description?: string;
    order: number;
    badge_color?: string; // hex for UI badge
  }>;
};

export type FileCategoryConfig = {
  categories: Array<{
    slug: string;
    label: string;
    description?: string;
    accept?: string[]; // e.g. ["image/*", "application/pdf"]
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
  | "structured_list"; // e.g. team members

export type BriefField = {
  key: string;
  label: string;
  type: BriefFieldType;
  required?: boolean;
  help?: string;
  options?: string[]; // for select / checkbox_list
  itemSchema?: BriefField[]; // for structured_list
};

export type BriefSection = {
  slug: string;
  label: string;
  description?: string;
  icon?: string; // tabler icon name
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

export const projectTemplates = pgTable(
  "project_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceTypeId: uuid("service_type_id")
      .notNull()
      .references(() => serviceTypes.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    description: text("description"),
    milestoneConfig: jsonb("milestone_config").$type<MilestoneConfig>().notNull(),
    fileCategories: jsonb("file_categories").$type<FileCategoryConfig>().notNull(),
    briefStructure: jsonb("brief_structure").$type<BriefStructure>().notNull(),
    defaultSettings: jsonb("default_settings")
      .$type<TemplateDefaultSettings>()
      .notNull()
      .default({}),
    version: integer("version").notNull().default(1),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    serviceTypeIdx: index("project_templates_service_type_idx").on(
      table.serviceTypeId,
    ),
  }),
);

export const offices = pgTable("offices", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  hubspotCompanyId: text("hubspot_company_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Users & auth                                                       */
/* ------------------------------------------------------------------ */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  userType: userTypeEnum("user_type").notNull(),
  /** scrypt-hashed password for staff who sign in with email + password. */
  passwordHash: text("password_hash"),
  /** True if this staff user can manage other staff (add, reset password, deactivate). */
  isAdmin: boolean("is_admin").notNull().default(false),
  /** Set to a timestamp when the staff user is deactivated. Clients never set this. */
  deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const magicLinks = pgTable(
  "magic_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    requestedIp: text("requested_ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tokenHashIdx: uniqueIndex("magic_links_token_hash_idx").on(table.tokenHash),
    userIdx: index("magic_links_user_idx").on(table.userId),
  }),
);

/* ------------------------------------------------------------------ */
/* Projects                                                           */
/* ------------------------------------------------------------------ */

/**
 * Snapshot of the template at the moment the project was created, plus any
 * project-specific overrides. We do this so editing a template later never
 * breaks an in-flight project.
 */
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

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    templateId: uuid("template_id")
      .notNull()
      .references(() => projectTemplates.id, { onDelete: "restrict" }),
    officeId: uuid("office_id")
      .notNull()
      .references(() => offices.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    status: projectStatusEnum("status").notNull().default("active"),
    currentMilestoneSlug: text("current_milestone_slug"),
    templateSnapshot: jsonb("template_snapshot")
      .$type<ProjectTemplateSnapshot>()
      .notNull(),
    links: jsonb("links").$type<ProjectLinks>().notNull().default({}),
    /** Visual design theme chosen at project creation (e.g. "Pacific Beach"). */
    websiteTheme: text("website_theme"),
    hubspotDealId: text("hubspot_deal_id"),
    mondayBoardId: text("monday_board_id"),
    mondayItemId: text("monday_item_id"),
    launchedAt: timestamp("launched_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    organizationIdx: index("projects_organization_idx").on(table.organizationId),
    officeIdx: index("projects_office_idx").on(table.officeId),
    statusIdx: index("projects_status_idx").on(table.status),
  }),
);

export const projectMembers = pgTable(
  "project_members",
  {
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: projectMemberRoleEnum("role").notNull(),
    addedAt: timestamp("added_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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

export const contentBriefs = pgTable(
  "content_briefs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    sectionSlug: text("section_slug").notNull(),
    status: contentBriefStatusEnum("status").notNull().default("not_started"),
    content: jsonb("content").$type<BriefContent>().notNull().default({}),
    /** Staff feedback note when status = needs_revision. Shown to client in the brief editor. */
    revisionNote: text("revision_note"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    submittedByUserId: uuid("submitted_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectSectionIdx: uniqueIndex("content_briefs_project_section_idx").on(
      table.projectId,
      table.sectionSlug,
    ),
  }),
);

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    uploadedByUserId: uuid("uploaded_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    category: text("category").notNull(),
    filename: text("filename").notNull(),
    storageKey: text("storage_key").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    mimeType: text("mime_type").notNull(),
    scanStatus: fileScanStatusEnum("scan_status").notNull().default("pending"),
    scanCompletedAt: timestamp("scan_completed_at", { withTimezone: true }),
    scanDetails: jsonb("scan_details").$type<Record<string, unknown>>(),
    /** Previous version of this file when replaced — older versions kept for recovery. */
    supersededById: uuid("superseded_by_id"),
    isFinal: boolean("is_final").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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

export const internalNotes = pgTable(
  "internal_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index("internal_notes_project_idx").on(table.projectId),
  }),
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectCreatedIdx: index("activity_log_project_created_idx").on(
      table.projectId,
      table.createdAt,
    ),
  }),
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    userCreatedIdx: index("audit_log_user_created_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const emailDeliveryLog = pgTable(
  "email_delivery_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    toEmail: text("to_email").notNull(),
    fromEmail: text("from_email").notNull(),
    subject: text("subject").notNull(),
    template: text("template").notNull(),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    providerMessageId: text("provider_message_id"),
    status: emailStatusEnum("status").notNull().default("queued"),
    error: text("error"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    projectIdx: index("email_delivery_log_project_idx").on(table.projectId),
    statusIdx: index("email_delivery_log_status_idx").on(table.status),
  }),
);

/* ------------------------------------------------------------------ */
/* Messaging                                                          */
/* ------------------------------------------------------------------ */

/**
 * Simple per-project message thread between the client and the TDO team.
 * isFromStaff = true  → sent by a staff member
 * readAt              → when the other party first read the message
 */
export const projectMessages = pgTable(
  "project_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    isFromStaff: boolean("is_from_staff").notNull().default(false),
    /** Timestamp when the recipient (other party) first read this message. */
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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

export const notificationTypeEnum = pgEnum("notification_type", [
  "revision_requested",
  "message_received",
  "preview_ready",
  "milestone_changed",
  "brief_submitted",
]);

/**
 * Discrete in-app notifications for client users.
 * Staff notifications are handled via email for V1.
 */
export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    type: notificationTypeEnum("type").notNull(),
    body: text("body").notNull(),
    linkHref: text("link_href"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
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

export const kbArticles = pgTable(
  "kb_articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    category: text("category").notNull().default("general"),
    tags: text("tags").array(),
    active: boolean("active").notNull().default(true),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryIdx: index("kb_articles_category_idx").on(table.category),
    activeIdx: index("kb_articles_active_idx").on(table.active),
  }),
);

/* ------------------------------------------------------------------ */
/* Relations                                                          */
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
