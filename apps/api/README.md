# @glosspilot/api

Fastify + Drizzle + Postgres backend.

**Status:** stub. Real implementation lands in v0.2.0 (auth) and v0.3.0 (sites CRUD).

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
