# Security

## What data this app handles

GlossPilot stores:

- **User accounts:** email, name, role, bcrypt-hashed password.
- **Operational data:** job/site records with client names and addresses (may be PII if individuals, not businesses), worker assignments, material consumption, free-text daily reports.
- **Audit trail:** every mutation logged with `user_id`, `action`, `entity`, `entity_id`, JSONB payload.
- **(v0.6+) File uploads:** object photos, stored in S3-compatible bucket.

This is **PII-relevant data**. Anyone deploying GlossPilot for real use is a data controller under GDPR / equivalent laws.

## What this app does NOT do

- Send data to third parties.
- Log passwords, password hashes, or session tokens.
- Store payment info, ID documents, biometrics, or health data.
- Phone home or send telemetry.

## Threat model (single-tenant deployment)

| Threat | Mitigation |
|---|---|
| SQL injection | Drizzle parameterized queries only — no raw concat. |
| XSS via report/site fields | React escapes by default; no `dangerouslyInnerHTML`. |
| CSRF | better-auth session cookies are SameSite=Lax + bearer fallback for API. |
| Password brute force | bcrypt + rate limit on `/auth/login` (planned v0.2.0). |
| Privilege escalation | RBAC enforced server-side on every route, never trusting client `role`. |
| Audit log tampering | Append-only at app layer; deploy with DB user that has no DELETE/UPDATE on `audit_log`. |
| Data exfiltration via backups | Operator's responsibility — encrypt backups at rest. |

## Known issues (v0.1.0)

- No backend yet — only docs and scaffolding.
- No rate limiting yet.
- No 2FA.
- No automated dependency scanning configured in CI yet.

## Reporting a vulnerability

Email: al9teeq@gmail.com — please do not open a public issue for security bugs.

## GDPR notes for deployers

- Run a DPIA before deploying with real customer data.
- Configure backup retention per your data-retention policy.
- The `audit_log` table is your "Article 30 record of processing" raw material — keep it.
- Provide an export endpoint and a delete endpoint for data-subject requests (planned: v0.7.0).
