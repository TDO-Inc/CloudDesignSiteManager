-- TDO Client Portal — Initial Schema for Azure SQL DB
-- Generated manually (drizzle-kit@mssql pre-release does not yet support T-SQL generation).
-- Apply with: sqlcmd -S <server> -d <db> -U <user> -P <pass> -i drizzle/0000_initial_schema.sql
--             or Azure Data Studio / SSMS.

-- ---------------------------------------------------------------------------
-- Reference tables
-- ---------------------------------------------------------------------------

CREATE TABLE service_types (
  id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  name          NVARCHAR(MAX)    NOT NULL,
  slug          NVARCHAR(255)    NOT NULL,
  active        BIT              NOT NULL DEFAULT 1,
  created_at    DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_service_types PRIMARY KEY (id),
  CONSTRAINT UQ_service_types_slug UNIQUE (slug)
);

CREATE TABLE offices (
  id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  name          NVARCHAR(MAX)    NOT NULL,
  slug          NVARCHAR(255)    NOT NULL,
  active        BIT              NOT NULL DEFAULT 1,
  created_at    DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_offices PRIMARY KEY (id),
  CONSTRAINT UQ_offices_slug UNIQUE (slug)
);

CREATE TABLE organizations (
  id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  name                NVARCHAR(MAX)    NOT NULL,
  hubspot_company_id  NVARCHAR(255),
  created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_organizations PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- Users & auth
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  email           NVARCHAR(255)    NOT NULL,
  name            NVARCHAR(255)    NOT NULL,
  user_type       NVARCHAR(10)     NOT NULL,        -- 'staff' | 'client'
  password_hash   NVARCHAR(MAX),
  is_admin        BIT              NOT NULL DEFAULT 0,
  deactivated_at  DATETIMEOFFSET,
  last_login_at   DATETIMEOFFSET,
  created_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_users PRIMARY KEY (id),
  CONSTRAINT UQ_users_email UNIQUE (email)
);

CREATE TABLE magic_links (
  id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  user_id       UNIQUEIDENTIFIER NOT NULL,
  token_hash    NVARCHAR(255)    NOT NULL,
  expires_at    DATETIMEOFFSET   NOT NULL,
  used_at       DATETIMEOFFSET,
  requested_ip  NVARCHAR(45),
  user_agent    NVARCHAR(MAX),
  created_at    DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_magic_links PRIMARY KEY (id),
  CONSTRAINT FK_magic_links_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX magic_links_token_hash_idx ON magic_links (token_hash);
CREATE        INDEX magic_links_user_idx        ON magic_links (user_id);

-- ---------------------------------------------------------------------------
-- Templates & projects
-- ---------------------------------------------------------------------------

CREATE TABLE project_templates (
  id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  service_type_id   UNIQUEIDENTIFIER NOT NULL,
  name              NVARCHAR(MAX)    NOT NULL,
  description       NVARCHAR(MAX),
  -- JSON stored as NVARCHAR(MAX); application serialises/deserialises
  milestone_config  NVARCHAR(MAX)    NOT NULL,
  file_categories   NVARCHAR(MAX)    NOT NULL,
  brief_structure   NVARCHAR(MAX)    NOT NULL,
  default_settings  NVARCHAR(MAX)    NOT NULL,
  version           INT              NOT NULL DEFAULT 1,
  active            BIT              NOT NULL DEFAULT 1,
  created_at        DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_project_templates PRIMARY KEY (id),
  CONSTRAINT FK_project_templates_service_type
    FOREIGN KEY (service_type_id) REFERENCES service_types (id) ON DELETE NO ACTION
);
CREATE INDEX project_templates_service_type_idx ON project_templates (service_type_id);

CREATE TABLE projects (
  id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  organization_id         UNIQUEIDENTIFIER NOT NULL,
  template_id             UNIQUEIDENTIFIER NOT NULL,
  office_id               UNIQUEIDENTIFIER NOT NULL,
  name                    NVARCHAR(MAX)    NOT NULL,
  status                  NVARCHAR(20)     NOT NULL DEFAULT 'active',  -- 'active'|'archived'|'cancelled'
  current_milestone_slug  NVARCHAR(255),
  template_snapshot       NVARCHAR(MAX)    NOT NULL,  -- JSON
  links                   NVARCHAR(MAX)    NOT NULL,  -- JSON
  website_theme           NVARCHAR(255),
  hubspot_deal_id         NVARCHAR(255),
  monday_board_id         NVARCHAR(255),
  monday_item_id          NVARCHAR(255),
  launched_at             DATETIMEOFFSET,
  archived_at             DATETIMEOFFSET,
  created_at              DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_projects PRIMARY KEY (id),
  CONSTRAINT FK_projects_organization
    FOREIGN KEY (organization_id) REFERENCES organizations (id) ON DELETE NO ACTION,
  CONSTRAINT FK_projects_template
    FOREIGN KEY (template_id) REFERENCES project_templates (id) ON DELETE NO ACTION,
  CONSTRAINT FK_projects_office
    FOREIGN KEY (office_id) REFERENCES offices (id) ON DELETE NO ACTION
);
CREATE INDEX projects_organization_idx ON projects (organization_id);
CREATE INDEX projects_office_idx        ON projects (office_id);
CREATE INDEX projects_status_idx        ON projects (status);

CREATE TABLE project_members (
  project_id  UNIQUEIDENTIFIER NOT NULL,
  user_id     UNIQUEIDENTIFIER NOT NULL,
  role        NVARCHAR(20)     NOT NULL,  -- 'owner'|'pm'|'designer'|'developer'|'client'
  added_at    DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_project_members PRIMARY KEY (project_id, user_id),
  CONSTRAINT FK_project_members_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT FK_project_members_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX project_members_user_idx ON project_members (user_id);

-- ---------------------------------------------------------------------------
-- Content briefs & files
-- ---------------------------------------------------------------------------

CREATE TABLE content_briefs (
  id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  project_id            UNIQUEIDENTIFIER NOT NULL,
  section_slug          NVARCHAR(255)    NOT NULL,
  status                NVARCHAR(20)     NOT NULL DEFAULT 'not_started',
  content               NVARCHAR(MAX)    NOT NULL,  -- JSON
  revision_note         NVARCHAR(MAX),
  submitted_at          DATETIMEOFFSET,
  submitted_by_user_id  UNIQUEIDENTIFIER,
  updated_at            DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  created_at            DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_content_briefs PRIMARY KEY (id),
  CONSTRAINT FK_content_briefs_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT FK_content_briefs_user
    FOREIGN KEY (submitted_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE UNIQUE INDEX content_briefs_project_section_idx ON content_briefs (project_id, section_slug);

CREATE TABLE files (
  id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  project_id            UNIQUEIDENTIFIER NOT NULL,
  uploaded_by_user_id   UNIQUEIDENTIFIER,
  category              NVARCHAR(255)    NOT NULL,
  filename              NVARCHAR(500)    NOT NULL,
  storage_key           NVARCHAR(500)    NOT NULL,
  size_bytes            BIGINT           NOT NULL,
  mime_type             NVARCHAR(255)    NOT NULL,
  scan_status           NVARCHAR(20)     NOT NULL DEFAULT 'pending',
  scan_completed_at     DATETIMEOFFSET,
  scan_details          NVARCHAR(MAX),  -- JSON
  superseded_by_id      UNIQUEIDENTIFIER,
  is_final              BIT              NOT NULL DEFAULT 0,
  created_at            DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_files PRIMARY KEY (id),
  CONSTRAINT FK_files_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT FK_files_user
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX files_project_category_idx ON files (project_id, category);
CREATE INDEX files_scan_status_idx       ON files (scan_status);

-- ---------------------------------------------------------------------------
-- Notes, activity, audit, email
-- ---------------------------------------------------------------------------

CREATE TABLE internal_notes (
  id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  project_id      UNIQUEIDENTIFIER NOT NULL,
  author_user_id  UNIQUEIDENTIFIER NOT NULL,
  body            NVARCHAR(MAX)    NOT NULL,
  created_at      DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_internal_notes PRIMARY KEY (id),
  CONSTRAINT FK_internal_notes_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT FK_internal_notes_user
    FOREIGN KEY (author_user_id) REFERENCES users (id) ON DELETE NO ACTION
);
CREATE INDEX internal_notes_project_idx ON internal_notes (project_id);

CREATE TABLE activity_log (
  id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  project_id  UNIQUEIDENTIFIER NOT NULL,
  user_id     UNIQUEIDENTIFIER,
  action      NVARCHAR(255)    NOT NULL,
  metadata    NVARCHAR(MAX),  -- JSON
  created_at  DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_activity_log PRIMARY KEY (id),
  CONSTRAINT FK_activity_log_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT FK_activity_log_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX activity_log_project_created_idx ON activity_log (project_id, created_at);

CREATE TABLE audit_log (
  id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  user_id      UNIQUEIDENTIFIER,
  action       NVARCHAR(255)    NOT NULL,
  target_type  NVARCHAR(100),
  target_id    NVARCHAR(255),
  ip_address   NVARCHAR(45),
  user_agent   NVARCHAR(MAX),
  metadata     NVARCHAR(MAX),  -- JSON
  created_at   DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_audit_log PRIMARY KEY (id),
  CONSTRAINT FK_audit_log_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX audit_log_user_created_idx ON audit_log (user_id, created_at);

CREATE TABLE email_delivery_log (
  id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  to_email            NVARCHAR(255)    NOT NULL,
  from_email          NVARCHAR(255)    NOT NULL,
  subject             NVARCHAR(500)    NOT NULL,
  template            NVARCHAR(100)    NOT NULL,
  project_id          UNIQUEIDENTIFIER,
  user_id             UNIQUEIDENTIFIER,
  provider_message_id NVARCHAR(255),
  status              NVARCHAR(20)     NOT NULL DEFAULT 'queued',
  error               NVARCHAR(MAX),
  metadata            NVARCHAR(MAX),  -- JSON
  created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_email_delivery_log PRIMARY KEY (id),
  CONSTRAINT FK_email_delivery_log_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL,
  CONSTRAINT FK_email_delivery_log_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX email_delivery_log_project_idx ON email_delivery_log (project_id);
CREATE INDEX email_delivery_log_status_idx  ON email_delivery_log (status);

-- ---------------------------------------------------------------------------
-- Messaging & notifications
-- ---------------------------------------------------------------------------

CREATE TABLE project_messages (
  id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  project_id    UNIQUEIDENTIFIER NOT NULL,
  user_id       UNIQUEIDENTIFIER NOT NULL,
  body          NVARCHAR(MAX)    NOT NULL,
  is_from_staff BIT              NOT NULL DEFAULT 0,
  read_at       DATETIMEOFFSET,
  created_at    DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_project_messages PRIMARY KEY (id),
  CONSTRAINT FK_project_messages_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT FK_project_messages_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
CREATE INDEX project_messages_project_created_idx ON project_messages (project_id, created_at);
CREATE INDEX project_messages_unread_idx           ON project_messages (project_id, is_from_staff, read_at);

CREATE TABLE notifications (
  id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  user_id     UNIQUEIDENTIFIER NOT NULL,
  project_id  UNIQUEIDENTIFIER,
  type        NVARCHAR(30)     NOT NULL,
  body        NVARCHAR(MAX)    NOT NULL,
  link_href   NVARCHAR(500),
  read_at     DATETIMEOFFSET,
  created_at  DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_notifications PRIMARY KEY (id),
  CONSTRAINT FK_notifications_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT FK_notifications_project
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE SET NULL
);
CREATE INDEX notifications_user_created_idx ON notifications (user_id, created_at);
CREATE INDEX notifications_user_unread_idx  ON notifications (user_id, read_at);

-- ---------------------------------------------------------------------------
-- Knowledge base
-- ---------------------------------------------------------------------------

CREATE TABLE kb_articles (
  id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
  title               NVARCHAR(500)    NOT NULL,
  content             NVARCHAR(MAX)    NOT NULL,
  category            NVARCHAR(100)    NOT NULL DEFAULT 'general',
  tags                NVARCHAR(MAX),   -- JSON string array
  active              BIT              NOT NULL DEFAULT 1,
  created_by_user_id  UNIQUEIDENTIFIER,
  updated_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  created_at          DATETIMEOFFSET   NOT NULL DEFAULT SYSDATETIMEOFFSET(),
  CONSTRAINT PK_kb_articles PRIMARY KEY (id),
  CONSTRAINT FK_kb_articles_user
    FOREIGN KEY (created_by_user_id) REFERENCES users (id) ON DELETE SET NULL
);
CREATE INDEX kb_articles_category_idx ON kb_articles (category);
CREATE INDEX kb_articles_active_idx   ON kb_articles (active);

-- ---------------------------------------------------------------------------
-- Full-text search (required for CONTAINSTABLE queries in kb-search.ts)
-- Note: the database must have the Full-Text Search feature installed.
-- Azure SQL DB supports full-text search; local SQL Server may need the
-- Full-Text and Semantic Extractions feature enabled during installation.
-- ---------------------------------------------------------------------------

CREATE FULLTEXT CATALOG kb_ft_catalog AS DEFAULT;
GO
CREATE FULLTEXT INDEX ON kb_articles (title, content)
  KEY INDEX PK_kb_articles
  ON kb_ft_catalog
  WITH CHANGE_TRACKING AUTO;
GO
