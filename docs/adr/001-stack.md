# ADR 001 — Technology Stack

**Status:** Accepted
**Date:** 2026-05-14

## Context

GlossPilot is an open-source field-ops dashboard template. It must:

1. Be hireable on the freelancer market (matches actual Upwork demand)
2. Boot in one command on a fresh machine (junior devs can fork it)
3. Have a vendor-light backend (no SaaS lock-in for the deployer)
4. Survive without a build-step revolution every 6 months

## Decision

| Layer | Choice | Alternative considered |
|---|---|---|
| Backend runtime | Node 22 LTS | Bun (too young for prod claim), Deno (smaller hire pool) |
| HTTP framework | Fastify | Express (slower, weaker types), Hono (smaller ecosystem) |
| Language | TypeScript strict | Plain JS (rules out 60% of jobs), Go (different audience) |
| DB | Postgres 16 | MySQL (works, but Postgres has stronger JSON + RLS option later) |
| ORM | Drizzle | Prisma (heavier, slower migrations), Kysely (more boilerplate) |
| Auth | hand-rolled sessions (swap-ready) | better-auth (initially picked, see Reversal below), Lucia (deprecating), NextAuth (Next-coupled) |
| Frontend | React 18 + Vite | Svelte (smaller hire pool), Next (overkill for an SPA) |
| Styling | Tailwind | CSS modules (slower to iterate), Panda (younger) |
| Data fetching | TanStack Query | SWR (less feature-rich), Redux (overkill) |
| Form validation | Zod (shared schemas server+client) | Yup (no TS inference parity), Valibot (younger) |

## Consequences

**Positive:**
- One language across stack (TS) → shared zod schemas, fewer bugs at the boundary
- Drizzle migrations are plain SQL — easier to review than Prisma's DSL
- Fastify + Zod gives us OpenAPI for free if needed later
- Tailwind keeps CSS surface small; no design-system rewrite needed

**Negative:**
- Drizzle is younger than Prisma — fewer Stack Overflow answers
- Hand-rolled auth = no library safety net for 2FA, OAuth, email-verify, password-reset, rate-limit. Acceptable at 10-user single-tenant scale; documented as future work.
- TanStack Query has a learning curve for devs from useEffect-land

## Non-goals

- We will NOT add: tRPC (REST + zod is enough for this scale), GraphQL (overkill), micro-frontends (not at 10-user scale), Redux/Zustand (TanStack Query handles server state, React state handles UI state).

## Auth revision (2026-05-14)

Originally locked in `better-auth`. While building v0.2.0 we instead shipped
hand-rolled sessions (~150 LOC: bcrypt + opaque token cookie + `sessions`
table + `requireAuth`/`requireRole` preHandlers). Reasoning:

- The library's integration surface with Fastify 5 + Drizzle 0.38 was thicker
  than the actual auth code we needed.
- A 10-user single-tenant tool does not need OAuth, 2FA, email-verify, or
  password-reset on day one — adding them is a feature decision, not a
  framework decision.
- Hand-rolled audit-log hooks on login/logout cost zero glue code.
- Verifiability: curl + a quick `SELECT * FROM sessions` is the entire test
  surface. No library-internal state to mock.

The `sessions` table is intentionally library-agnostic (`id`, `user_id`,
`expires_at`). A future swap to better-auth or a Lucia successor is one
adapter file, not a rewrite.

## Reversal criteria

Switch stack if: (a) Drizzle is unmaintained for 6+ months, (b) Fastify v5 breaks something we can't patch, (c) a sponsor explicitly funds a Next.js rewrite, (d) auth requirements grow (OAuth/2FA/SSO) — at that point swap hand-rolled sessions for better-auth via the existing `sessions` table.
