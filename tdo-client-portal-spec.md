# TDO Software Client Portal — Feature Specification

**Status:** Decisions finalized, ready for development
**Pilot scope:** Internal testing first, then expand to live offices — website design only
**Long-term scope:** Multi-service platform (website design, local SEO, marketing assistance, reputation management)

---

## 1. Problem statement

Our current client onboarding for website design uses ad-hoc Google Drive folders. Clients struggle with Drive familiarity, files get misplaced, and there's no structured way to collect site content (copy, photos, brand assets). Staff spend significant time managing the back-and-forth manually.

This portal replaces that process with a branded, guided client experience that integrates with our existing systems (HubSpot for CRM, monday.com for project management, intranet for staff auth).

---

## 2. Strategic context

The pilot starts with internal testing on website design, then expands to live offices. The architecture must support adding additional services without re-platforming. Planned future services:

- Local SEO
- Marketing assistance
- Reputation management

**Implication:** the core domain model treats "project" as a generic service engagement. Two concepts drive variation:

- **Service type** — the category of work (Website Design, Local SEO, etc.)
- **Project template** — a specific configuration within a service type (e.g., "Basic 5-page website" vs. "Standard 10-page website" vs. "E-commerce")

Project templates define the milestones, content brief structure, and file categories. This lets us support both intra-service variation (basic vs. complex websites) and inter-service variation (websites vs. SEO) with one model.

---

## 3. Core concepts

| Concept | Description |
|---------|-------------|
| **Organization** | A client company. Has many projects over time. |
| **Service type** | A category of service (Website Design, Local SEO, etc.). Owns project templates. |
| **Project template** | A configuration of a service (e.g., "Basic 5-page website"). Defines milestones, content briefs, and file categories. |
| **Project** | An instance of a template for a specific organization. The unit of work. |
| **Content brief** | Structured content collection — one per "section" (page for websites, location for SEO, etc.). |
| **File** | An uploaded asset, categorized per the template's configuration. |
| **User** | A person — either staff or client contact. |
| **Project member** | A user's role on a specific project. |

---

## 4. Data model

```
service_types
  id, name, slug, active, created_at
  e.g., "Website Design", "Local SEO"

project_templates
  id, service_type_id (FK), name, description
  milestone_config (jsonb)    -- e.g., Kickoff → Content Collection → Round 1 Review → Revisions → Pre-Launch Setup → Training & Approval → Launch
  file_categories (jsonb)     -- e.g., [{slug: "logos", label: "Logos & branding"}, ...]
  brief_structure (jsonb)     -- defines sections and field schema
  default_settings (jsonb)
  version (int)
  created_at

offices
  id, name, slug, active, created_at
  e.g., "Springfield", "Shelbyville"

organizations
  id, name, hubspot_company_id (nullable), created_at

projects
  id, organization_id (FK), template_id (FK), office_id (FK), name, status
  links (jsonb)               -- staging_url, audit_url, etc. (template-defined)
  hubspot_deal_id (nullable), monday_board_id (nullable)
  created_at, launched_at (nullable), archived_at (nullable)

users
  id, email (unique), name
  user_type ('staff' | 'client')
  last_login_at, created_at

project_members
  project_id (FK), user_id (FK)
  role ('owner' | 'pm' | 'designer' | 'developer' | 'client')
  added_at
  PRIMARY KEY (project_id, user_id)

files
  id, project_id (FK), uploaded_by (FK), category
  filename, storage_key, size_bytes, mime_type
  scan_status ('pending' | 'clean' | 'infected')
  created_at

content_briefs
  id, project_id (FK), section_slug, status
  content (jsonb)             -- structure determined by template's brief_structure
  updated_at

magic_links
  id, user_id (FK), token_hash, expires_at, used_at (nullable), created_at

activity_log
  id, project_id (FK), user_id (FK, nullable), action, metadata (jsonb), created_at

audit_log
  id, user_id (FK), action, target_type, target_id, ip_address, user_agent, metadata, created_at
```

**Design notes:**

- `project_templates` use `jsonb` for milestone/brief/file configuration so we can edit templates without schema migrations and support arbitrary service types.
- `projects.links` is `jsonb` rather than dedicated columns (like `staging_url`) so a SEO project can have an `audit_report_url` while a website project has a `staging_url` — same column, template defines what's expected.
- Template `version` lets us update templates without breaking existing projects. New projects use the latest version; existing projects keep their snapshot.
- `users.user_type` separates staff from clients at the app level; `project_members.role` handles per-project permissions.
- `magic_links.token_hash` stores SHA-256 of the token; raw tokens are never persisted.
- `offices` enables office-scoped projects. Staff see projects for their office by default; super admins have cross-office visibility. A project always belongs to exactly one office.

---

## 5. Feature inventory

Items tagged `[core]` are required for the pilot. Items tagged `[extended]` are valuable but can ship later.

### Authentication & access

- Magic-link auth for clients (email → token → session) `[core]`
- Intranet SSO for staff (SAML or OIDC) `[core]`
- Session management with sliding expiration `[core]`
- Rate limiting on auth endpoints (1 link per email per 60 seconds) `[core]`
- Logout and explicit session termination `[core]`
- Audit log of authentication events `[core]`
- Optional 2FA for staff accounts `[extended]`

### Client experience

- Project dashboard with status, next-step guidance, and key links `[core]`
- Status indicator showing current milestone (template-defined) `[core]`
- Categorized file upload area (drag-drop, multi-file, progress, preview) `[core]`
- Content brief forms (one per section, structure from template) `[core]`
- Auto-save on briefs `[core]`
- Mark section complete / reopen `[core]`
- Mobile-responsive throughout `[core]`
- First-visit onboarding screen `[core]`
- File operations: rename, replace, delete, version `[core]`
- Comment thread per project `[extended]`
- Per-file comments/annotations `[extended]`
- Approval flows (copy approval, design approval, launch sign-off) `[extended]`
- Embedded staging site preview `[extended]`
- Notification preferences `[extended]`
- In-app help / FAQ `[extended]`

### Staff experience

- Project list with filters (status, service type, client, assigned PM), search, sort `[core]`
- Project detail view (everything client sees + internal notes + edit controls) `[core]`
- Manual project creation flow (select service type → template → org) `[core]`
- Invite/manage client contacts; resend magic links `[core]`
- File review: download, bulk zip download, recategorize, mark final `[core]`
- Content brief review: see submitted content, mark complete, flag issues `[core]`
- Status management: update milestone, set staging URL/links, set target dates `[core]`
- Internal-only notes per project `[core]`
- Project-level activity feed `[core]`
- Org-wide activity feed `[extended]`
- Staff assignment per project (PM, designer, developer) `[extended]`
- Bulk operations (archive, export) `[extended]`

### Project templates & service types

- Service type management (create, activate/deactivate) `[core]`
- Template creation with milestones, file categories, brief structure `[core]`
- Template editing (admin-only) `[core]`
- Template versioning (existing projects keep their version when templates change) `[core]`
- Template selection at project creation `[core]`
- Template-defined "what success looks like" — e.g., "Launch" requires all briefs submitted + approval `[extended]`
- Template marketplace / library across the company `[extended]`
- Sub-templates or composable sections (mix-and-match for custom projects) `[extended]`

### Content collection

- Field types: short text, long text/rich text, image, file, URL, list, structured (e.g., team members) `[core]`
- Required vs. optional fields per template `[core]`
- Per-section status tracking `[core]`
- Reminder emails for incomplete sections after N days `[core]`
- Configurable reminder cadence per project `[extended]`
- Pre-fill from previous project (for clients refreshing existing sites) `[extended]`
- AI-assisted draft generation (write a first pass for clients to edit) `[extended]`

### File management

- Drag-and-drop upload via Azure Blob Storage SAS URLs (never proxies through server) `[core]`
- File categories per template (template defines allowed categories) `[core]`
- Virus/malware scanning before files become accessible `[core]`
- Content-type and file-size validation `[core]`
- Thumbnail generation for images and PDFs `[core]`
- File versioning (keep prior versions when replaced) `[core]`
- Bulk download as zip `[core]`
- File-level activity (uploaded by, when, scan status) `[core]`
- Mirroring to monday.com File column `[extended]`
- Direct integration with Google Drive / Dropbox for clients who prefer those `[extended]`

### Notifications

- Transactional emails: magic link, file uploaded, content submitted, status change, staging URL available, approval request `[core]`
- Email templates with TDO branding `[core]`
- Reminder system for stalled content collection `[core]`
- Email delivery logs for debugging `[core]`
- In-app notification center for staff `[extended]`
- Slack notifications to staff channels (new uploads, content submitted, approvals) `[extended]`
- SMS reminders for high-priority items `[extended]`
- Per-service-type notification templates `[extended]`

### Integrations

- Email delivery (Resend or similar) with SPF/DKIM `[core]`
- Intranet SSO for staff `[core]`
- HubSpot deal webhook → auto-create project `[extended]`
- HubSpot deal property sync (push status back) `[extended]`
- HubSpot contact lookup/creation for client emails `[extended]`
- monday.com item creation on project creation `[extended]`
- monday.com bidirectional status sync `[extended]`
- monday.com custom view widget to embed portal in board views `[extended]`
- Slack workspace integration `[extended]`
- Calendar sync for milestone dates `[extended]`

### Permissions & roles

- App-level roles: super admin, staff, client `[core]`
- Per-project staff roles: owner/PM, designer, developer, observer `[core]`
- Client contacts scoped to their project only (security-critical) `[core]`
- Multiple client contacts per project with equal access `[core]`
- Permission change audit log `[core]`
- Role-based field visibility (e.g., hide internal notes from designer role) `[extended]`

### Admin & operations

- Super-admin dashboard (system health, active sessions, recent errors) `[extended]`
- Email log for debugging delivery `[core]`
- Magic link audit (sent, opened, clicked) `[core]`
- Project archival and restoration `[core]`
- Hard delete for compliance / right-to-delete requests `[core]`
- Per-project data export (zip of files + briefs as JSON/markdown) `[core]`
- Template management UI `[core]`
- Service type management UI `[core]`
- Feature flags for staged rollouts `[extended]`
- Internal analytics: project duration, time-in-stage, response times `[extended]`

### Security & compliance

- HTTPS everywhere with HSTS `[core]`
- Encryption at rest for database and file storage `[core]`
- Azure Blob Storage SAS URLs with short expiration `[core]`
- Virus/malware scanning on all uploads `[core]`
- Content-type validation and file-size limits `[core]`
- Rate limiting on auth and upload endpoints `[core]`
- CSRF protection on state-changing requests `[core]`
- Audit log for sensitive actions (login, permission changes, file/project deletion) `[core]`
- Session timeout `[core]`
- Privacy policy and terms of service `[core]`
- Data retention policy (auto-archive N months post-launch) `[core]`
- GDPR/CCPA tooling `[extended]`
- SOC 2 readiness if enterprise clients require it `[extended]`

### Performance & infrastructure

- File uploads streamed directly to Azure Blob Storage (SAS URLs) `[core]`
- Image and PDF thumbnail generation (background job) `[core]`
- Pagination on all lists `[core]`
- Database backups with point-in-time recovery `[core]`
- Error monitoring (Sentry or equivalent) `[core]`
- Uptime monitoring with alerts `[core]`
- Background job queue (emails, scans, syncs) `[core]`
- Graceful degradation when external services (HubSpot, monday.com) are down `[core]`
- CDN for static assets `[core]`
- Database query monitoring and slow-query logging `[extended]`
- Load testing before broader rollout `[extended]`

---

## 6. Operational workflows to design for

These are the edge cases that should be considered during design rather than patched in later:

- A client has multiple stakeholders who all need access (owner, marketing, IT contact)
- A project gets handed from one PM to another mid-stream
- A client goes dark for 6 weeks and then returns — what state is everything in?
- Scope changes mid-project (basic tier → standard tier) — can the project's template change without losing data?
- A project is cancelled — what happens to uploaded files, content, and access?
- Post-launch refresh: client wants to come back a year later to update content
- A client uploads the wrong files or sensitive data — how do staff scrub it?
- Two clients use the same contact email (rare but real — agency accounts)
- Staff member leaves the company — assignments transfer, access revokes
- Client clicks an expired magic link — how forgiving is the recovery flow?
- A client has multiple concurrent projects (e.g., website + SEO once we add SEO) — does their dashboard show all of them?
- A single org has projects across multiple TDO offices — does each office see only theirs?

---

## 7. Pilot scope (V1)

Minimum viable scope for the pilot. Internal testing first, then expand to live offices. The goal is to validate the workflow before investing in integrations.

**Included:**

- Magic-link auth for clients
- Intranet SSO for staff (basic, even if not feature-complete)
- One service type: **Website Design**
- 2 starter templates: "Basic" and "Standard" (define the milestone sets, file categories, and brief structures)
- Project dashboard for clients (status, staging URL, file uploads, content briefs)
- File upload with virus scan and categorization
- Section-by-section content briefs with auto-save
- Mark section complete
- Email notifications: magic link, file uploaded, content submitted, status changed
- Staff project list and detail view
- Manual project creation
- Internal-only notes
- Activity log
- Email delivery log
- Hard delete and project archival
- Per-project data export

**Deferred from V1 (Phase 2):**

- HubSpot integration (manually create projects for pilot — staff just paste deal info)
- monday.com integration (use both tools separately during pilot)
- Slack notifications
- Comments and approval workflows
- Additional service types
- Template management UI (templates can be edited in DB/code during pilot)
- In-app help / FAQ
- Notification preferences

**Pilot success criteria** (suggested, for team to confirm):

- Pilot users use the portal exclusively (no Google Drive folders) for new website projects for 30+ days
- Average time-to-collect-content drops vs. current baseline (need to measure current baseline first)
- Zero security incidents (file leaks, cross-tenant data exposure)
- Net positive feedback from at least 5 clients
- Staff prefer the portal over Drive (survey)

---

## 8. Phase 2 and beyond

**Phase 2** — after pilot validates the approach (typically 30–90 days of pilot use):

- HubSpot integration (deal → project, status sync)
- monday.com integration (bidirectional)
- Slack notifications
- Template management UI for staff
- Approval workflows
- Comments
- Rollout to remaining offices

**Phase 3** — additional services:

- Local SEO service type with its own templates (single-location, multi-location)
- Marketing assistance service type
- Reputation management service type
- Cross-service dashboards for orgs with multiple concurrent projects
- Service-specific integrations (e.g., Google Business Profile API for SEO)

**Phase 4** — platform polish:

- AI-assisted content drafting
- Advanced analytics
- Client-facing analytics (for SEO/marketing services)
- API for third-party tool integration
- White-labeled per-office branding if relevant

---

## 9. Resolved decisions

All questions have been resolved. Development can proceed.

1. **Hosting:** GitHub repo, services manager deploys to Azure. App kept portable — no vendor-specific lock-in.
2. **Auth (clients):** Custom magic-link implementation with Resend. Full control over email UX and "expired link" recovery.
3. **ORM:** Drizzle. Better jsonb support, lighter weight, SQL-first approach.
4. **File storage:** Azure Blob Storage. TDO runs on Azure — all infrastructure stays in one ecosystem.
5. **Virus scanning:** Abstraction layer — services manager chooses implementation (e.g., Microsoft Defender for Storage, ClamAV).
6. **Staff SSO:** Pluggable auth interface matching company intranet user profiles. Services manager wires up the specific protocol.
7. **Email-from domain:** `webadmin@tdo4endo.com`. Requires SPF/DKIM configuration for Resend.
8. **Pilot offices:** Internal testing first, then expand to live offices.
9. **Timeline:** ASAP. Begin development immediately.
10. **Ownership:** Jared Ardine (product/design) + services manager (technical deployment/infrastructure).
11. **Migration:** Decide after internal testing. New projects only for now.
12. **Multi-office data model:** Office-scoped projects with cross-office visibility for super admins.

---

## 10. UI/UX design

UI/UX design is documented in detail in `TDO-Client-Portal-UI-UX-Design-Spec.docx`. Key decisions summarized here for reference.

### Client portal (hub-style dashboard)

- **Layout:** Top bar (dark navy) + left sidebar (200px, fixed) + center content area + collapsible AI assistant right panel (260px)
- **Navigation:** Sidebar with Dashboard, Content Briefs, Photos & Files, Preview Site, Messages, plus Resources (Training/LMS, Help Center) and Additional Services (SEO, ADA Compliance, More Services)
- **Content sections:** Displayed as a 2-column card grid, each card showing icon, section name, status badge, and description. Clients work on any section in any order (non-linear).
- **Status badges:** Done (green), X of Y (amber), To do (gray)
- **Progress tracking:** Overall progress bar at sidebar bottom + 7-segment milestone timeline bar in main content
- **AI assistant:** Floating button opens right sidebar panel with greeting, suggestion chips, text input. Helps clients write bios, identify missing content, navigate the portal.
- **Design inspiration:** Content Snare application UI (guided experience), adapted to non-linear hub layout

### Staff portal (HubSpot-inspired workspace)

- **Layout:** Top bar + icon rail (44px, left) + main content + collapsible right sidebar (280px) with toggle button
- **Icon rail navigation:** Dashboard, All Projects, Board View, Messages, Clients, Templates, Offices, Exports, Activity Log, Integrations, Help
- **Tab bar:** Summary (default), Projects, Clients, Tasks, Reports
- **Collapsible main sections (in order):** Messages (with unread count) → Client Updates (with action badges) → My Projects (with filter chips: All, Active, Needs Action, Stalled) → Recently Auto-Created (integration event cards from HubSpot/monday.com)
- **Right sidebar tabs:** Schedule (day calendar), Activity (recent feed), Feed (integration events)
- **Permissions:** Everyone sees everything (no role-based filtering in V1)
- **Design inspiration:** HubSpot Sales workspace (collapsible sections, filter chips, schedule sidebar)

### Brand colors

- Dark navy: #0F2B3C (top bar, headings)
- Green accent: #1A9E75 (active states, progress, CTAs)
- Milestone badge colors: Kickoff=purple (#EEEDFE), Content collection=amber (#FAEEDA), Round 1 review=blue (#E6F1FB), Revisions=pink (#FBEAF0), Pre-launch=green (#E1F5EE)

---

## 11. Integration architecture (V1)

V1 uses Zapier/Make as middleware rather than direct API connections. The portal exposes webhook endpoints; Zapier handles orchestration.

### Flow 1: HubSpot → Portal (project creation)

- **Trigger:** Deal moves to "Closed Won" in HubSpot Web Design pipeline
- **Action:** Zapier catches webhook → POSTs to portal `POST /api/projects`
- **Payload:** Office name/address, deal owner (mapped to "closer" role), template type (Basic/Standard), web designer assignment
- **Result:** Project created, team assigned, client magic-link invite sent

### Flow 2: Portal → monday.com (milestone sync)

- **Trigger:** Project milestone changes in portal
- **Action:** Portal sends webhook to Zapier → Zapier updates monday.com item status column
- **Payload:** project_id, office_name, new_milestone, previous_milestone, timestamp, triggered_by (staff/client)
- **Result:** monday.com Web Design board status updated, timeline adjusted, team notified

### API endpoints for integration

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/projects` | Create project (Zapier inbound from HubSpot) |
| POST | `/api/webhooks/milestone` | Outbound milestone change event (to Zapier) |
| GET | `/api/projects/:id` | Project detail |
| GET | `/api/projects` | Project list with filters |
| POST | `/api/auth/magic-link` | Send client magic-link email |

### Prerequisites for integration setup

1. Portal deployed with webhook endpoints
2. HubSpot pipeline configured with "Web Design" deal stage and custom properties (template type, designer assignment)
3. monday.com board set up with status column matching the 7 project milestones
4. API auth tokens generated for the portal
5. Zapier Team plan or higher (multi-step Zaps required)

---

## Appendix A: Tech stack (decided)

- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL
- **ORM:** Drizzle
- **UI:** Tailwind + shadcn/ui
- **Auth (clients):** Custom magic-link implementation with Resend
- **Auth (staff):** Pluggable — integrates with company intranet (services manager wires up)
- **Email:** Resend, sending from `webadmin@tdo4endo.com`
- **File storage:** Azure Blob Storage (SAS URLs for direct upload)
- **Virus scanning:** Abstraction layer (services manager chooses: Microsoft Defender for Storage, ClamAV, etc.)
- **Background jobs:** Inngest, Trigger.dev, or Postgres-backed queue (start simple)
- **Hosting:** GitHub repo, services manager deploys to Azure
- **Error monitoring:** Sentry
- **Uptime monitoring:** Better Stack, Pingdom, or similar
- **Analytics (internal):** PostHog or similar
