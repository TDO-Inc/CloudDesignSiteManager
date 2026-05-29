# Content Capture — Project Context

## What this is
**TDO Software Client Portal** — a branded, guided client experience for collecting website content (copy, photos, brand assets) that replaces the current ad-hoc Google Drive folder process. Built for TDO's internal use with their clients.

## Current status
**V1 core is built — now in the hardening / pre-pilot phase.**
The spec (`tdo-client-portal-spec.md`) is finalized, all 12 open questions resolved (see below), and UI/UX design is complete (`TDO-Client-Portal-UI-UX-Design-Spec.docx`). The Next.js app is implemented and runs against a Supabase Postgres instance: client magic-link auth, staff auth (behind a pluggable provider), client dashboard, staff workspace (project list/filters/detail), content briefs with auto-save, file uploads (Azure SAS), in-app + email notifications, client↔staff messaging, activity log, audit log, per-project zip export, archive/delete, knowledge base + AI assistant, template-driven config, and multi-office model. `npm run typecheck`, `npm run lint`, and `npm run test` all pass.

### Remaining before live clients
Production blockers (mostly the services-manager-owned pluggable pieces):
1. **Real virus scanning** — `scan-providers/noop.ts` always returns `clean`. Plug in Defender for Storage / ClamAV behind the existing `ScanProvider` interface.
2. **Real staff SSO** — `auth/providers/dev.ts` auto-logs-in a dev user. Wire the intranet provider behind the existing `AuthProvider` interface.
3. **Sentry** — package installed but never initialized; add `sentry.*.config.ts` + DSN (error monitoring is a core spec requirement).
4. **Azure Blob + Resend** — code is ready; needs `AZURE_STORAGE_*` credentials and SPF/DKIM for `webadmin@tdo4endo.com`.

Likely-needed before pilot:
5. Broader test coverage (unit tests exist for password hashing, `cn`, email templates, and template config; DB-touching flows are untested).
6. A `next build` CI job (current CI runs typecheck/lint/test only — build needs DB + secrets).
7. Privacy / ToS pages.

Note: the dev-bypass demo client (`demo@tdo4endo.com`) isn't a seeded project member, so it always shows the empty dashboard state — sign in as a seeded client (e.g. `dr.roberts@…`) via magic link to see a populated project.

## Team
- **Jared Ardine** — product owner, planning, design
- **Services manager** — technical deployment, infrastructure, hosting, SSO wiring, virus scan selection

## Pilot scope
- Internal testing first, then expand to live offices
- One service type: Website Design
- 2 starter templates: "Basic" and "Standard"
- Magic-link auth for clients, intranet SSO for staff
- Core features: project dashboard, file uploads w/ virus scan, content briefs w/ auto-save, email notifications, staff project management, activity log, data export

## Key architecture decisions
- **Domain model:** service types > project templates > projects — designed to scale to Local SEO, Marketing, Reputation Management later
- **Template-driven:** milestones, file categories, and brief structures defined in jsonb on `project_templates`, not hardcoded
- **Template versioning:** existing projects keep their template snapshot when templates are updated
- **File uploads:** direct to Azure Blob Storage via SAS URLs (never proxied through server)
- **Users:** staff vs. client at app level; per-project roles (owner, PM, designer, developer, client) handle permissions
- **Multi-office model:** projects belong to an office, with cross-office visibility for admins
- **Pluggable infrastructure:** virus scanning and staff SSO built behind abstraction layers so services manager can plug in his preferred solutions

## Tech stack (decided)
- **Framework:** Next.js (App Router)
- **Database:** PostgreSQL
- **ORM:** Drizzle (better jsonb handling, lighter footprint)
- **UI:** Tailwind + shadcn/ui
- **Auth (clients):** Custom magic-link implementation with Resend
- **Auth (staff):** Pluggable — integrates with company intranet user profiles (services manager wires up)
- **Email:** Resend, sending from `webadmin@tdo4endo.com`
- **File storage:** Azure Blob Storage
- **Virus scanning:** Abstraction layer — services manager chooses implementation (ClamAV, Microsoft Defender for Storage, etc.)
- **Error monitoring:** Sentry
- **Hosting:** GitHub repo, services manager deploys to Azure (keep app portable)

## Integrations (deferred to Phase 2 — designed, not yet built)
- **V1:** Manual project creation only. No integrations. Webhook endpoints built into the portal for future use.
- **Phase 2 approach:** Zapier/Make as middleware (not direct API). Portal exposes webhook endpoints; Zapier handles orchestration.
- **HubSpot (Phase 2):** Deal closed-won in Web Design pipeline → Zapier → POST /api/projects (auto-creates project, assigns team, sends client invite)
- **monday.com (Phase 2):** Portal milestone change → Zapier → monday.com status column update on Web Design board
- **Slack:** Deferred to Phase 2
- **Direct API integration:** Planned for later phases to replace Zapier

## Phasing
- **V1 (Pilot):** Core portal — manual project creation, no integrations, internal testing first
- **Phase 2:** HubSpot + monday.com integration, Slack, approval workflows, comments, template management UI, broader rollout to live offices
- **Phase 3:** Additional service types (Local SEO, Marketing, Reputation Management)
- **Phase 4:** AI content drafting, analytics, API, white-labeling

## Resolved decisions (formerly open questions)
1. **Hosting** → GitHub repo, services manager deploys to Azure. Keep app portable.
2. **Auth (clients)** → Custom magic-link with Resend. Full control over email UX.
3. **ORM** → Drizzle. Better jsonb support, lighter weight.
4. **File storage** → Azure Blob Storage. TDO runs on Azure — all infrastructure stays in one ecosystem.
5. **Virus scanning** → Abstraction layer; services manager picks the implementation (e.g., Microsoft Defender for Storage, ClamAV).
6. **Staff SSO** → Pluggable auth interface matching company intranet. Services manager wires up.
7. **Email-from domain** → `webadmin@tdo4endo.com` (needs SPF/DKIM for Resend).
8. **Pilot offices** → Internal testing first, then expand to live offices.
9. **Timeline** → ASAP. Begin development immediately.
10. **Ownership** → Jared (product/design) + services manager (technical/infra).
11. **Migration** → Decide after internal testing. New projects only for now.
12. **Multi-office data model** → Office-scoped projects with cross-office admin visibility.

## UI/UX design decisions
- **Client portal:** Hub-style dashboard with card grid (not linear/checklist). Left sidebar nav (Dashboard, Content Briefs, Photos & Files, Preview Site, Messages, Training, Help, SEO, ADA, More Services). AI assistant right panel. Non-linear workflow — clients work on any section in any order.
- **Staff portal:** HubSpot Sales workspace pattern. Icon rail nav (44px), collapsible content sections (Messages first, then Client Updates, My Projects, Recently Auto-Created), collapsible right sidebar with Schedule/Activity/Feed tabs. Filter chips on project list.
- **Brand colors:** Dark navy (#0F2B3C), green accent (#1A9E75)
- **Design inspirations:** Content Snare (guided client experience), HubSpot Sales workspace (staff data density)
- **Permissions model:** Everyone sees everything (no role-based filtering in V1)
- **CMS stack:** Beaver Builder, RankMath for SEO

## Key files
- `tdo-client-portal-spec.md` — full feature specification
- `website-templates.md` — detailed template definitions (milestones, file categories, page catalog, Basic vs Standard)
- `TDO-Client-Portal-UI-UX-Design-Spec.docx` — consolidated UI/UX design document with layout specs, component details, and integration flows
