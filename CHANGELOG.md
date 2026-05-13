# Changelog

All notable changes to GlossPilot will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · SemVer.

## [Unreleased]

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
