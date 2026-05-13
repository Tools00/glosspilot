# ADR 003 — Database Schema

**Status:** Accepted
**Date:** 2026-05-14

## Context

10-table schema for the dispatch + worker pattern. Designed once, frozen until v0.5.0 ships — schema churn during early development costs more than getting v1 perfect.

## Tables

```
users         (id, email UK, password_hash, name, initials, role, created_at)
                role ENUM: ADMIN | WORKER

sites         (id, client_name, address, lat, lng, color, status,
               total_units, done_units, start_date, end_date,
               created_by FK→users, created_at, updated_at)
                status ENUM: planned | active | completed | archived

tasks         (id, site_id FK→sites, name, unit, total, done, position)

materials     (id, site_id FK→sites, name, variant, needed_qty, taken_qty, per_unit)

events        (id, site_id FK→sites, title, note,
               start_date, end_date, color, created_at)

event_workers (event_id FK→events, user_id FK→users, PRIMARY KEY composite)

reports       (id, site_id FK→sites, user_id FK→users,
               summary, reported_at)

tool_catalog  (id, category, name, recommended)

holidays      (id, date, name, locale)

audit_log     (id, user_id FK→users, action, entity, entity_id,
               payload JSONB, ts)
```

## Design decisions

### 1. `users.role` as ENUM, not a `roles` table

Only two roles, no plan to add more. A `roles` table would be over-engineering. If a third role appears, we ALTER TYPE and migrate.

### 2. `event_workers` as composite-PK join table, not array column

Postgres `int[]` would work but kills referential integrity (you can have a worker_id in an event that points to a deleted user). Composite PK = ON DELETE CASCADE works cleanly.

### 3. `audit_log.payload` as JSONB

The audit log is write-only. We don't query inside payload often, but when we do (e.g., "show me all material edits to site #42"), JSONB indexing is there. Plain TEXT would force JSON.parse() on every read.

### 4. `sites` has `total_units` / `done_units` redundant with `SUM(tasks.total) / SUM(tasks.done)`

Intentional denormalization. Dashboard aggregates query `sites` directly without joining tasks. Trigger keeps them in sync (or app-layer update — TBD in ADR 006).

### 5. `lat / lng` on sites even though we don't have a map yet

Cheap to add now (8 bytes each), expensive to backfill later. Future map view is a v0.6+ feature.

### 6. No `soft_delete` column

Archive via `status = archived` for sites. Other entities are hard-deleted with CASCADE — no compliance reason to soft-delete tasks or materials in a 10-user single-tenant app.

### 7. No `tenant_id` anywhere

Single-tenant by design (ADR 002 non-goal). Adding multi-tenancy later = one migration adding `tenant_id` to every table + RLS policies. Not free, but explicit.

### 8. `audit_log.entity` as string, not FK

A polymorphic FK isn't worth a `morph_entity_table` lookup. `entity = 'site'` / `entity_id = 42` is fine for the volumes here. We trade referential integrity for simplicity.

## Indexes (planned)

- `users.email` UNIQUE (auth lookups)
- `sites.status` (dashboard filters)
- `events.start_date, events.end_date` (calendar range queries)
- `event_workers.user_id` (worker's "today" query)
- `reports.reported_at` DESC (recent reports feed)
- `audit_log.entity, audit_log.entity_id` (entity history view)

## Consequences

**Positive:**
- 10 tables is small enough to hold in your head
- Denormalized `sites.done_units` makes the dashboard query a single SELECT
- Audit log + JSONB payload covers the compliance story for free

**Negative:**
- Denormalization risk: drift between `sites.done_units` and `SUM(tasks.done)` if the trigger fails — must have a reconciliation script
- ENUM role complicates "add a role" later — explicit trade-off

## Reversal criteria

Reconsider schema if: (a) we add a third role, (b) we add multi-tenancy, (c) audit log volume exceeds 100M rows (then partition by month).
