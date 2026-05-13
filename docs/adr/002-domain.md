# ADR 002 — Domain & Demo Data

**Status:** Accepted
**Date:** 2026-05-14

## Context

The template needs a concrete demo domain so the seed data feels real and the UI copy isn't placeholder lorem-ipsum. The domain must be:

1. Universally understood (no jargon barrier)
2. Structurally identical to the generic "dispatch + worker" pattern (no domain-specific data model leaks)
3. Not in conflict with any client work the author is doing

## Decision

**Demo domain: mobile car detailing.** A dispatcher (ADMIN) schedules detailing jobs at customer addresses; workers (WORKER) drive out, execute the wash/polish/coating, log materials used, file a daily report.

Why this domain:
- Every reviewer instantly understands "wash a car" without onboarding
- Has natural variants (interior / exterior / ceramic coating) → realistic task lists
- Material consumption is plausible (polish, microfiber, wax) → realistic stock tracking
- Mobile-first by definition (workers on phones in the field) → forces responsive UI

## Generic core, swappable skin

The data model uses **domain-neutral terminology** (sites, tasks, materials, events, reports). Only the seed data and UI copy are detailing-specific. Forkers can:

1. Replace `db/seed.ts` with their own scenario
2. Replace `apps/web/src/copy/en.ts` with their domain vocabulary
3. Rename nothing in the schema

A cleaning company, HVAC service, or property maintenance firm can use the same code with different seed data.

## Demo data shape

- 6 users: 1 dispatcher + 5 workers (real-looking names, no real PII)
- 5 sites: mix of `planned | active | completed` statuses, addresses from OpenStreetMap demo data
- 8 events spread across the current calendar month
- 4 today-reports
- A national holiday list for the demo locale (Latvia by default — easy to swap)

## Consequences

**Positive:**
- Reviewers grok the app in <30 seconds
- Seed data carries enough signal to demo dashboard aggregations meaningfully

**Negative:**
- Some risk of being typecast as a "car app developer" — mitigated by the generic schema and the README's "fork for your niche" framing

## Reversal criteria

Swap demo domain if: (a) a paid sponsor wants their domain featured, (b) car detailing pulls in low-signal traffic, (c) feedback shows reviewers confuse the demo for the template's only use case.
