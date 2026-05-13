# @glosspilot/api

Fastify + Drizzle + Postgres backend.

**Status:** v0.1.1 — DB layer in. Auth + HTTP routes land in v0.2.0.

## Quickstart (from repo root)

```bash
pnpm install
cp .env.example .env                # then edit DATABASE_URL if needed
pnpm db:up                          # docker compose: postgres + adminer
pnpm --filter @glosspilot/api db:generate    # generate migration from schema.ts
pnpm --filter @glosspilot/api db:migrate     # apply to db
pnpm --filter @glosspilot/api db:seed        # demo data
pnpm --filter @glosspilot/api db:studio      # browse db at https://local.drizzle.studio
```

Demo logins after seed:
- ADMIN:  `dispatch@glosspilot.dev` / `demo`
- WORKER: `crew1@glosspilot.dev` / `demo`

Planned layout:

```
src/
├── server.ts            # Fastify bootstrap, routes registration
├── env.ts               # zod-validated process.env
├── auth/                # better-auth setup, session middleware
├── rbac/                # ADMIN/WORKER guards
├── db/
│   ├── schema.ts        # Drizzle table defs (mirrors ADR 003)
│   ├── client.ts        # pg pool
│   ├── migrate.ts       # drizzle-kit runner
│   └── seed.ts          # demo data (6 users, 5 sites, 8 events)
├── routes/
│   ├── sites.ts
│   ├── events.ts
│   ├── reports.ts
│   ├── users.ts
│   └── dashboard.ts
└── lib/audit.ts         # write to audit_log
```
