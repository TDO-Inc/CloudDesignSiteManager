# TDO Software Client Portal

Branded, guided client experience for collecting website content (copy, photos, brand assets) for TDO Software's website design projects. Replaces the ad-hoc Google Drive folder workflow.

See `CLAUDE.md` for project context, `tdo-client-portal-spec.md` for the feature spec, `website-templates.md` for template definitions, and `TDO-Client-Portal-UI-UX-Design-Spec.docx` for UI/UX.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind + shadcn/ui
- PostgreSQL with Drizzle ORM
- Magic-link auth (Resend) for clients; pluggable `AuthProvider` interface for staff SSO
- Azure Blob Storage (direct upload via SAS URLs) with pluggable `ScanProvider` for virus scanning
- Sentry (wire up by setting `SENTRY_DSN`)

## Local setup

```powershell
# 1. Copy env template
Copy-Item .env.example .env

# 2. Edit .env — set DATABASE_URL and SESSION_SECRET (>=32 chars).
#    Leave Resend / Azure / Sentry blank for now — dev fallbacks are in place.

# 3. Push schema + seed
npm run db:push
npm run db:seed

# 4. Run dev server
npm run dev
```

Visit:
- `http://localhost:3000/sign-in` — client magic-link (email is logged to console in dev)
- `http://localhost:3000/staff/sign-in` — staff (dev provider auto-logs in `DEV_STAFF_EMAIL`)
- `http://localhost:3000/staff/projects/new` — create a project

## Dev fallbacks

| Service | Without env vars |
|---|---|
| Resend | Emails printed to console |
| Azure Blob | Throws clearly when an upload is attempted — set `AZURE_STORAGE_ACCOUNT` / `_KEY` |
| Virus scan | `NoOpScanProvider` returns `clean` immediately (DO NOT use in production) |
| Staff SSO | `DevAuthProvider` auto-authenticates as `DEV_STAFF_EMAIL` |

## Plugging in real providers

- **Staff SSO** — add a new module under `src/lib/auth/providers/` that implements `AuthProvider`, then add a case in `getStaffAuthProvider()` and set `STAFF_AUTH_PROVIDER` accordingly.
- **Virus scan** — add a new module under `src/lib/storage/scan-providers/` implementing `ScanProvider`, add a case in `getScanProvider()`, set `SCAN_PROVIDER`.

## Scripts

```
npm run dev          # next dev
npm run build        # next build
npm run typecheck    # tsc --noEmit
npm run db:push      # drizzle-kit push
npm run db:generate  # drizzle-kit generate
npm run db:studio    # drizzle-kit studio
npm run db:seed      # seed service types + Basic/Standard templates
```

## V1 scope

Everything marked `[core]` in `tdo-client-portal-spec.md` §5. Magic-link client auth, manual project creation, content briefs with auto-save, file uploads with categorization, milestone progression, internal staff notes, activity log, email notifications, per-project zip export, archive + hard delete.

HubSpot / monday.com / Slack integration, comments, approval workflows, and additional service types are Phase 2+.
