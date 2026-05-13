# How GlossPilot works (user guide)

> **Status:** outline. Filled in alongside each feature release.

---

## 1. The two roles

GlossPilot has exactly two user roles:

- **ADMIN (dispatcher)** — creates jobs, assigns workers, tracks materials, sees the full dashboard.
- **WORKER (field crew)** — sees only their own assignments, reports their daily progress, marks tasks done.

There is no "manager" or "viewer" role. If you need finer permissions, fork and add them.

## 2. Daily flow

### Admin morning

1. Open dashboard → see today's active sites, overnight reports, low-stock materials.
2. If a new job came in: click **New Site** → fill client, address, tasks, materials → save.
3. Open calendar → drag a site onto a date range → pick workers → confirm.
4. Throughout the day: review worker reports as they come in.

### Worker morning

1. Log in on phone → see today's job(s).
2. Tap a job → see tasks, required materials, address (tap = navigate via Maps).
3. Mark tasks as done as you go.
4. End of day: tap **Add Report** → short text summary → submit.

## 3. Data ownership

One deployment = one company. There is no cross-tenant separation because there's only ever one tenant. If you need multi-tenancy, this is the wrong template — fork and add `tenant_id` everywhere (non-trivial).

## 4. Where data lives

- All operational data: your Postgres instance.
- Uploaded photos (v0.6+): S3-compatible bucket of your choice.
- Sessions: Postgres (via better-auth).
- Nothing leaves your infrastructure.

## 5. Backups

GlossPilot ships no backup tooling. Use your hosting provider's Postgres backups, or `pg_dump` on a cron. Backups are an operator responsibility — covered briefly in `SECURITY.md`.

## 6. Forking for your domain

GlossPilot demoes mobile car detailing. To re-skin for another field-services niche:

1. Edit `apps/api/src/db/seed.ts` → your demo data.
2. Edit `apps/web/src/copy/en.ts` → your domain vocabulary.
3. (optional) Edit color palette in `tailwind.config.ts`.
4. (optional) Edit `docs/adr/002-domain.md` to record your fork's domain.

You should NOT need to touch the schema for most field-services niches.

---

*Sections below fill in per release.*

## 7. Authentication (v0.2.0 — TODO)

## 8. Sites & tasks (v0.3.0 — TODO)

## 9. Calendar (v0.4.0 — TODO)

## 10. Reports & dashboard (v0.5.0 — TODO)

## 11. File uploads (v0.6.0 — TODO)

## 12. Audit log viewer (v0.7.0 — TODO)
