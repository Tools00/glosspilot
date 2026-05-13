# Changelog

All notable changes to GlossPilot will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · SemVer.

## [Unreleased]

### Added (v0.4.0 — Chunk B: Calendar Frontend + Users picker)
- New API route: `GET /users` (auth-required list for picker UIs, no password_hash)
- `apps/web/src/api/{events,users}.ts`: TanStack Query hooks
- `apps/web/src/lib/calendar.ts`: ISO-string date helpers, monthGrid, monthLabel
- Pages:
  - `Calendar`: month grid (Mon-first), color-coded event bars, today highlight,
    prev/next/today nav, "Mine only" filter for workers, ADMIN-click-day to create
  - `NewEventModal`: site picker (excludes archived), worker multi-select chips
    via Controller, date range with zod refine
  - `EventDetailModal`: site link, worker chips, ADMIN-only delete with confirm
- Home: shows "My jobs today" KPI + today's-schedule list (from `/me/today`)
- Nav: added Calendar link
- Vite: nothing to change — proxy still routes all `/api/*` to API

### Added (v0.4.0 — Chunk A: Events/Calendar API)
- 5 routes in `apps/api/src/routes/events.ts`: range list, detail, create, patch, delete
- `GET /me/today` worker endpoint
- `GET /users` minimal list endpoint
- Range overlap predicate; bulk-fetches workers in a single query
- POST inherits site color when none given; validates site existence
- PATCH replaces workerIds atomically via DELETE+INSERT in a transaction
- DELETE relies on `event_workers.eventId` CASCADE
- Shared schemas: `createEventSchema` (with start≤end refine), `updateEventSchema`,
  `eventRangeQuerySchema` (with from≤to refine), `eventSchema`, `eventWithWorkersSchema`
- 10/10 curl tests pass

### Added (v0.3.0 — Chunk B: Sites Frontend)
- `apps/web/src/api/sites.ts`: TanStack Query hooks for list/detail/create/update/archive
- `apps/web/src/components/AppShell.tsx`: header + nav (Home / Sites) + user dropdown
- `apps/web/src/components/StatusBadge.tsx`: role-styled status pills
- Pages:
  - `SitesList`: filter (All / Planned / Active / Completed / Archived), pagination,
    color dot per site, progress percentage, click-through to detail
  - `SiteDetail`: tasks + materials with progress bars, ADMIN-only status switch + archive
  - `NewSiteModal`: react-hook-form + zodResolver against `createSiteSchema`,
    `useFieldArray` for tasks + materials add/remove, atomic submit
  - `Home`: live KPIs reading from `/sites?status=active` and `?status=planned`
- Refactor: router uses `Outlet` + `AppShellRoute` wrapper so all protected pages share the shell

### Verified
- Sites list renders 5 seeded sites correctly
- Filter switches counts (All=5, Active=3, Planned=1, Completed=1)
- WORKER does NOT see "+ New site" or status/archive buttons
- ADMIN can create a site with 2 tasks + 1 material via the modal
- DB reseeded to clean state for the live demo

### Added (v0.3.0 — Chunk A: Sites CRUD API)
- `apps/api/src/routes/sites.ts`:
  - `GET /sites` — paginated list (`page`, `pageSize`, optional `status` filter)
  - `GET /sites/:id` — site with nested `tasks` and `materials`
  - `POST /sites` (ADMIN) — atomic insert of site + nested tasks + materials in a transaction
  - `PATCH /sites/:id` (ADMIN) — partial update with "at least one field" refinement
  - `DELETE /sites/:id` (ADMIN) — soft-delete via `status='archived'`
- Audit log entries on every write (`create`, `update`, `archive`) with payload
- `@glosspilot/shared`: `SiteStatus`, `taskInputSchema`, `materialInputSchema`,
  `createSiteSchema`, `updateSiteSchema`, `siteListQuerySchema`, `siteSchema`,
  `siteWithChildrenSchema` — single source of truth for API and (forthcoming) web forms
- Custom hex-color regex with friendly error message (`Must be a hex color like #2C5F2E`)

### Verified (12 curl cases)
- list + filter + pagination ✓
- detail with tasks/materials ✓
- WORKER POST → 403 ✓
- ADMIN POST with 2 tasks + 1 material → atomic insert, all 3 rows returned by GET ✓
- PATCH status=active ✓
- PATCH empty body → 400 (zod refine) ✓
- DELETE → status=archived, GET confirms ✓
- POST with invalid color → 400 with descriptive message ✓
- audit log shows 3 entries (create/update/archive) with payloads ✓

### Added (v0.2.0 — Chunk B: Frontend)
- `apps/web/` Vite 6 + React 18 + TypeScript + Tailwind 4 (alpha vite plugin)
- React Router 7 with `/login` and protected `/`
- TanStack Query 5 wrapping the auth hooks (`useMe`, `useLogin`, `useLogout`)
- `ProtectedRoute` honors role-based access
- Login page with `react-hook-form` + `zod-resolver`, importing
  `loginSchema` from `@glosspilot/shared` (single source of truth)
- Home page renders different stub dashboards for ADMIN vs WORKER
- Vite dev-proxy `/api/*` → `http://127.0.0.1:3001` so the browser never
  hits cross-origin issues in dev
- End-to-end verified: login → cookie set → /me on next reload → role-aware UI → logout → 401 again

### Added (v0.2.0 — Chunk A: API + Auth)
- Fastify 5 server with `@fastify/cookie`, `@fastify/cors`, `fastify-type-provider-zod`
- Routes: `POST /auth/login`, `POST /auth/logout`, `GET /me`, `GET /health`
- Hand-rolled session management (`apps/api/src/lib/sessions.ts`):
  random 32-byte base64url tokens, 7-day TTL, opaque cookie `glosspilot_session`,
  `httpOnly`+`sameSite=lax`, `secure` in production
- Sessions table in DB (migration 0001), with FK cascade + indexes
- RBAC: `requireAuth` and `requireRole(...roles)` preHandlers
- Audit logging on login/logout via `apps/api/src/lib/audit.ts`
- Constant-time-ish bcrypt compare even on email-miss (anti-timing-oracle)
- `@glosspilot/shared` package with `loginSchema` + `userPublicSchema` (Zod, shared between API and future web)
- Drizzle upgraded to `^0.38.3`
- Pino-pretty for dev logs

### Verified
- 7/7 curl test cases: login, /me with cookie, /me without (401),
  wrong password (401), invalid body (400 + zod details),
  logout, /me after logout (401)
- 2 audit entries written for one full session

## [0.1.1] — 2026-05-14

### Added
- `apps/api/src/db/schema.ts` — full Drizzle schema for all 10 tables from ADR 003,
  including enums, FK cascade behavior, indexes (status, calendar range,
  worker assignment, recent reports, audit entity lookup), and typed relations.
- `apps/api/src/db/client.ts` — pg pool + Drizzle instance.
- `apps/api/src/db/seed.ts` — idempotent demo seed: 6 users (1 dispatcher + 5 workers),
  5 sites across Germany, 8 calendar events with worker assignments, 4 reports,
  9 tool catalog entries, 4 holidays. Passwords hashed with bcrypt cost 10.
- `apps/api/src/env.ts` — zod-validated process.env, fail-fast on missing config.
- `apps/api/drizzle.config.ts`, `apps/api/tsconfig.json` (strict).
- API package.json with real deps: drizzle-orm, pg, zod, bcryptjs, dotenv;
  dev: drizzle-kit, tsx, typescript.

### Notes
- Schema is frozen until v0.5.0 unless ADR 003 changes — any schema edit
  requires updating the ADR first.

## [0.1.0] — 2026-05-14

### Added
- Project bootstrap: `README.md`, `.env.example`, `.gitignore`, `CHANGELOG.md`, `LICENSE` (MIT), `SECURITY.md`
- ADR 001: stack decision (Node + Fastify + TS + Postgres + Drizzle + React + Vite)
- ADR 002: domain decision (mobile car detailing as demo skin, generic core)
- ADR 003: 10-table schema
- Architecture diagram, ER diagram, user-flow sequence diagram (Mermaid in README)
- Local diagram preview at `docs/architecture.html`
- pnpm workspace: `apps/api`, `apps/web`, `packages/shared` (stubs with planned-layout READMEs)
- `docker-compose.yml`: Postgres 16 + Adminer for local dev
- `docs/HOW-IT-WORKS.md` outline
