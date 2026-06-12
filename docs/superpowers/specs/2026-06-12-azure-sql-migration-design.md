# Azure SQL DB Migration Design

**Date:** 2026-06-12
**Status:** Approved

## Context

The app currently targets PostgreSQL (Supabase) via `drizzle-orm/pg-core` and the `postgres-js` driver. The goal is to move to an Azure SQL Database instance on the team's existing elastic pool — zero incremental infrastructure cost. This is a fresh deployment with no data to migrate.

## Scope

Structural changes: `schema.ts`, `db/index.ts`, `drizzle.config.ts`, `.env.example`, `package.json`.
Code changes: `kb-search.ts`, `seed-kb.ts`, `kb/route.ts`, `kb/[articleId]/route.ts`.
All other Drizzle query code is untouched.

## Section 1 — Schema translation (`src/lib/db/schema.ts`)

All imports switch from `drizzle-orm/pg-core` to `drizzle-orm/mssql-core`. Column type mapping:

| PostgreSQL | Azure SQL |
|---|---|
| `pgTable` | `mssqlTable` |
| `uuid().defaultRandom()` | `uniqueidentifier().defaultRandom()` (uses `NEWID()`) |
| `text` | `nvarchar('max')` |
| `boolean` | `bit` |
| `integer` | `int` |
| `bigint` | `bigint` |
| `timestamp({ withTimezone: true })` | `datetimeoffset` |
| `jsonb.$type<T>()` | `nvarchar('max').$type<T>()` — verify during implementation that Drizzle mssql-core auto-serializes these; if not, explicit `JSON.stringify`/`JSON.parse` wrappers are needed at every jsonb read/write site |
| `text().array()` (`kbArticles.tags`) | `nvarchar('max')` — app code serializes as JSON string |
| `pgEnum` (×7) | Removed — columns become `nvarchar(n)`; TypeScript union types enforce values; Zod validation at API boundaries enforces at runtime |

The 7 enums removed: `user_type`, `project_member_role`, `project_status`, `file_scan_status`, `content_brief_status`, `email_status`, `notification_type`.

## Section 2 — Driver and connection

**`package.json`**
- Remove: `postgres`
- Add: `mssql`

**`src/lib/db/index.ts`**
- Switch driver from `postgres-js` to `mssql` (node-mssql / Tedious)
- Import `drizzle` from `drizzle-orm/mssql` instead of `drizzle-orm/postgres-js`
- Pool config (`max: 10`, idle timeout) maps to node-mssql equivalents
- Lazy-init Proxy pattern stays unchanged

**`drizzle.config.ts`**
- `dialect: "postgresql"` → `dialect: "mssql"`
- Connection string format:
  ```
  Server=tcp:<server>.database.windows.net,1433;Database=<db>;User Id=<user>;Password=<pass>;Encrypt=True;TrustServerCertificate=False;
  ```

**`.env.example`**
- Updated `DATABASE_URL` to SQL Server format
- Local dev: use `mcr.microsoft.com/mssql/server` Docker image or a local SQL Server instance

## Section 3 — Code changes

### `src/lib/ai/kb-search.ts`

Replace PostgreSQL `tsvector/tsquery` full-text search with SQL Server `CONTAINSTABLE`. A full-text catalog and full-text index on `kb_articles(title, content)` must exist (created in the first Drizzle migration as a manual `sql` block).

Replacement query:
```sql
SELECT TOP (@limit) k.id, k.title, k.content, k.category
FROM kb_articles k
INNER JOIN CONTAINSTABLE(kb_articles, (title, content), @query) ct ON k.id = ct.[KEY]
WHERE k.active = 1
ORDER BY ct.[RANK] DESC
```

### `kbArticles.tags` — 3 files

The PostgreSQL array column becomes `nvarchar('max')`. Files requiring `JSON.stringify`/`JSON.parse` wrappers:

- `src/lib/db/seed-kb.ts` — stringify on insert
- `src/app/api/staff/kb/route.ts` — stringify on write, parse on read
- `src/app/api/staff/kb/[articleId]/route.ts` — stringify on update

No other query files require changes — all Drizzle ORM select/insert/update/delete calls are dialect-agnostic.

## Section 4 — Migration and deployment

### Schema generation and apply

1. `npm run db:generate` — generates T-SQL migration files from the new mssql schema
2. Manually append full-text search setup to the generated migration:
   ```sql
   CREATE FULLTEXT CATALOG kb_ft_catalog AS DEFAULT;
   CREATE FULLTEXT INDEX ON kb_articles(title, content)
     KEY INDEX <PK_constraint_name>   -- confirm name from generated migration file
     ON kb_ft_catalog;
   ```
3. `npm run db:migrate` — applies migrations to Azure SQL DB
4. `npm run db:seed` and `npm run db:seed-kb` — unchanged (Drizzle insert API is dialect-agnostic)

### Environment variables

`DATABASE_URL` changes format in:
- `.env.example` (committed)
- GitHub environment secret `DATABASE_URL` (production)
- Azure App Service Application Settings `DATABASE_URL`

### CI/CD

`.github/workflows/deploy.yml` requires no structural changes — `DATABASE_URL` is already passed as a secret at build time and configured as an App Setting at runtime.

## Out of scope

- Azure SQL elastic pool provisioning and database creation (services manager task)
- Adding the new `DATABASE_URL` to GitHub Secrets and Azure App Settings (services manager task)
- Local dev Docker setup documentation
