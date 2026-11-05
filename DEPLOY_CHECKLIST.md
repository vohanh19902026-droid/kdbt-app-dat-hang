# Production deployment checklist

Run this checklist for each release. A green build alone is not a production approval.

## Pre-deploy

- [ ] Confirm the intended Git branch, commit, tag, Vercel project, and target environment.
- [ ] Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build`.
- [ ] Run `npm audit --omit=dev --audit-level=moderate` and review any findings.
- [ ] Review changed routes for authentication, role checks, CSRF/origin checks, validation, and ownership checks.
- [ ] Inspect migrations: additive and rollback-compatible; dry-run against the intended database.
- [ ] Verify a current backup or provider recovery point exists. For an export backup, verify it with `pg_restore --list`.
- [ ] Confirm preview uses a separate Neon branch and separate `DATABASE_URL` and auth secret. Never copy production credentials into Preview.
- [ ] Complete role-based browser UAT on Preview; capture screenshots, assert the main success and error paths, and confirm zero page errors.
- [ ] Run a bounded read-only load check against Preview and record p50/p95, error rate, and connection limits.

## Deploy and verify

- [ ] Push the reviewed commit to `main`; wait for GitHub Actions and Vercel Production to finish.
- [ ] Confirm the Production deployment is Ready and points to the expected commit.
- [ ] Apply migrations only after the verified backup/recovery point and migration dry-run.
- [ ] Check `/api/health`, login, one read-only workflow per role, notification delivery, and XLSX export.
- [ ] Confirm no secrets, database dumps, device tokens, or source maps were committed or uploaded as public artifacts.
- [ ] Record version, deployment URL, health result, latency sample, rollback target, and known gaps in `docs/release-assessment-YYYY-MM-DD.md`.

## Rollback

- [ ] If smoke checks fail, promote the previous Ready Vercel deployment and preserve the failed deployment logs.
- [ ] Keep database changes additive so the prior app version remains compatible.
- [ ] Restore data only from a verified backup/recovery point and only into a separately named branch first; validate before any production restore.
