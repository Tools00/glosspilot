# Changelog

All notable changes to GlossPilot will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · SemVer.

## [Unreleased]

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
