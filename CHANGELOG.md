# Changelog

All notable changes to GlossPilot will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · SemVer.

## [Unreleased]

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
