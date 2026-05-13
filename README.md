# GlossPilot

> Field-ops dashboard for mobile car-detailing crews — dispatch jobs, track materials, log daily work.

**Status:** v0.1.0 — bootstrap phase. No backend yet, no DB yet.
**License:** MIT
**Stack:** Node 22 · Fastify · TypeScript · Postgres 16 · Drizzle ORM · React 18 · Vite · Tailwind · better-auth

---

## Why this exists

A real, runnable starter kit for the pattern "field-services dispatch + worker app":
**admin** plans the schedule, assigns workers, tracks material stock; **workers** see their day, mark progress, log usage. Same shape powers cleaning crews, HVAC service, property maintenance, and yes — car detailing.

Open-source so others can fork it for their own niche instead of vibe-coding the same wheel a hundredth time.

---

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    SPA[React + Vite SPA<br/>TanStack Query<br/>Tailwind UI]
  end

  subgraph Server[Node 22 / Fastify]
    API[REST API<br/>Zod validation]
    Auth[better-auth<br/>session cookies]
    RBAC[RBAC middleware<br/>ADMIN / WORKER]
  end

  subgraph Data
    PG[(Postgres 16)]
    Drizzle[Drizzle ORM<br/>+ migrations]
  end

  Files[/Object photos<br/>S3-compatible/]

  SPA -- fetch + cookies --> API
  API --> Auth
  API --> RBAC
  RBAC --> Drizzle
  Drizzle --> PG
  API --> Files
```

## Domain model

```mermaid
erDiagram
  USERS ||--o{ SITES : "created_by"
  USERS ||--o{ REPORTS : "filed"
  USERS ||--o{ AUDIT_LOG : "did"
  SITES ||--o{ TASKS : "has"
  SITES ||--o{ MATERIALS : "consumes"
  SITES ||--o{ EVENTS : "scheduled_as"
  SITES ||--o{ REPORTS : "covers"
  EVENTS }o--o{ USERS : "assigned via event_workers"
  TOOL_CATALOG ||--o{ TOOL_CATEGORIES : "groups"

  USERS {
    int id PK
    string email UK
    string password_hash
    string name
    string initials
    enum role "ADMIN | WORKER"
    timestamp created_at
  }
  SITES {
    int id PK
    string client_name
    string address
    float lat
    float lng
    string color
    enum status "planned | active | completed | archived"
    int total_units
    int done_units
    date start_date
    date end_date
    int created_by FK
  }
  TASKS {
    int id PK
    int site_id FK
    string name
    string unit
    int total
    int done
    int position
  }
  MATERIALS {
    int id PK
    int site_id FK
    string name
    string variant
    float needed_qty
    float taken_qty
    float per_unit
  }
  EVENTS {
    int id PK
    int site_id FK
    string title
    string note
    date start_date
    date end_date
    string color
  }
  REPORTS {
    int id PK
    int site_id FK
    int user_id FK
    text summary
    timestamp reported_at
  }
  AUDIT_LOG {
    int id PK
    int user_id FK
    string action
    string entity
    int entity_id
    jsonb payload
    timestamp ts
  }
```

## User flow (admin vs. worker)

```mermaid
sequenceDiagram
  participant Admin
  participant API
  participant DB
  participant Worker

  Admin->>API: POST /sites (new job)
  API->>DB: insert site + tasks + materials
  API-->>Admin: 201 Created

  Admin->>API: POST /events (assign workers)
  API->>DB: insert event + event_workers
  API-->>Admin: 201 Created

  Note over Worker: morning login
  Worker->>API: GET /me/today
  API->>DB: events where worker_id = me AND date = today
  API-->>Worker: list of jobs

  Worker->>API: POST /reports {site_id, summary}
  API->>DB: insert report + audit_log
  API-->>Worker: 201 Created

  Admin->>API: GET /dashboard
  API->>DB: aggregate active sites, today's reports, material burn
  API-->>Admin: dashboard payload
```

---

## Quickstart

```bash
# requires: node 22, pnpm, postgres 16, docker (optional)
git clone <repo>
cd glosspilot
cp .env.example .env          # fill in DATABASE_URL + AUTH_SECRET
pnpm install
pnpm db:migrate
pnpm db:seed                  # demo: 6 users, 5 sites, 8 events
pnpm dev                      # api + web in parallel
```

Demo logins after seed:
- Admin: `dispatch@glosspilot.dev` / `demo`
- Worker: `crew1@glosspilot.dev` / `demo`

---

## Project layout

```
glosspilot/
├── apps/
│   ├── api/                  # Fastify + Drizzle
│   └── web/                  # React + Vite
├── packages/
│   └── shared/               # zod schemas, types
├── docs/
│   ├── adr/                  # architecture decisions
│   ├── architecture.html     # local mermaid preview
│   └── HOW-IT-WORKS.md       # user guide (TODO)
├── docker-compose.yml        # postgres + adminer
├── .env.example
└── CHANGELOG.md
```

---

## Non-goals (intentionally NOT in scope)

- Multi-tenancy (one company per deployment — fork for SaaS)
- Real-time push (polling is fine for ≤50 users)
- Mobile-native app (responsive web works for the field)
- Invoicing / payments (out of scope, integrate Stripe externally)
- AI features (this is a clean reference impl — add agents in your fork)

---

## Roadmap

- [x] v0.1.0 — bootstrap, docs, ADRs
- [ ] v0.2.0 — auth + RBAC + users CRUD
- [ ] v0.3.0 — sites + tasks + materials CRUD
- [ ] v0.4.0 — calendar + event assignment
- [ ] v0.5.0 — reports + dashboard
- [ ] v0.6.0 — file uploads (object photos)
- [ ] v0.7.0 — audit log viewer
- [ ] v1.0.0 — Dockerized, deployed demo, docs complete

---

## License

MIT — see `LICENSE`.
