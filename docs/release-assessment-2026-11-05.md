# CENCOM production handoff assessment — 2026-11-05

## Release decision

**Not ready to release the feature branch to Production.** The active Production deployment still returned HTTP 500 from `GET /api/notifications` after the migration was applied to Neon Production `main`. Neon confirms that the table exists on `main`; the remaining evidence points to a mismatch between the database/schema used by the live deployment and the database/schema that was migrated. Do not merge or deploy the feature branch until this is reconciled and the live endpoint is verified.

### Update — 2026-11-05: Production DB guard added

- Added `scripts/verify-production-database.mjs`; Production builds now require the effective `DATABASE_URL` host to resolve to the independently verified Neon main endpoint and database `neondb` before migrations can run. The guard logs only the sanitized hostname and database name, never credentials.
- Production Vercel Config now contains the expected endpoint ID and database name. On the next Production build, the guard will stop the build before writes if the linked URL points at another endpoint/database. If it matches, the build runs migration dry-run followed by the idempotent migrations before compiling.
- `node --check` passed for the updated build script and new guard; `git diff --check` passed. This change has not yet been pushed or exercised on Vercel. Preview, Production endpoint, notification route, browser UAT, and Android device checks remain release gates.

The app's Production database has been changed during this handoff. A recovery branch was created before migration; details are below.

## Production database change and verification

- Confirmed Neon Production project `neon-cinnabar-bucket`, branch `main`, database `neondb`.
- Created persistent copy-on-write recovery branch `pre-release-20261105` before applying migrations. It is not configured to auto-delete. The branch has not been used for restore testing and must be retained until release risk is resolved.
- Dry-run against the verified Neon `main` target listed migrations `0005` through `0011` as pending.
- Applied migrations `0005_app_notifications.sql` through `0011_fix_default_sand_catalog_typo.sql` to that Neon `main` target. The migration command reported 7 new files and 12 total.
- A read-only Neon SQL query then confirmed `app_notifications` exists and `_app_migrations` contains `0000` through `0011`. Counts remained 1 order and 1 customer; the active runtime user ID was present.
- Neon reports a six-hour PITR window. The recovery branch provides a pre-release copy-on-write recovery point. No restore/rollback exercise has been performed.

## Live Production checks

- Vercel Production deployment `dpl_7h4xShHzCca2hR3yZAenNZjNh4AJ` continued to return HTTP 500 for `/api/notifications` after the migration. The latest observed failures were at 2026-11-05 01:37 UTC, about 20 minutes after the migrations completed. Runtime logs still reported PostgreSQL `42P01: relation "app_notifications" does not exist`.
- `https://kdbt-app-dat-hang-five.vercel.app/api/health` returned `{"status":"ok","database":"up"}`. This confirms database reachability, but it does not identify the target branch or prove the notification query succeeds.
- A new VAPID key pair, separate from Preview, is configured in Vercel Production: private/public keys are Secrets and the subject is Config (`mailto:admin@cencom.vn`). The values have not been pulled or shown. The active Production deployment predates this configuration and will need a later deployment to receive them. Push delivery has not been verified on a real Android device.
- The Vercel project has Production `DATABASE_URL` configured as a hidden secret. It was not read into chat or changed. Vercel MCP requests returned 403 for deployment/runtime/environment data; the Vercel CLI could list environment variable names and request/runtime logs, but not values.
- An attempt to pull the Production environment into a temporary file solely to compare its target host/database was rejected by automatic approval review. No Production environment values were decrypted or copied. Use the Vercel/Neon integration UI to verify the effective target without revealing the credential.
- Therefore, the active deployment's DB host/database/schema has **not** been proven to match the migrated Neon Production `main`. Investigate the active Production deployment's effective `DATABASE_URL` target through the authorized Vercel/Neon integration settings without exposing the credential, then apply any missing migration only to the verified active Production target. Re-run the authenticated notification endpoint check after that.

## Branch, Preview, and local verification

- Branch `feature/notifications-scale-android` is pushed through commit `b33b276`.
- Draft PR #1 is open and the Vercel check passed: https://github.com/vohanh19902026-droid/kdbt-app-dat-hang/pull/1
- Preview deployment for commit `6611ab3` reached Ready. Neon created `preview/feature/notifications-scale-android` under the isolated Preview project `cencom-preview-isolated`; its migration build skipped `0000`–`0010` and applied `0011_fix_default_sand_catalog_typo.sql`.
- Preview read-only health load: concurrency 10, 85 requests, 0 failures, 10.91 seconds; request p95 3,714 ms and database round-trip p95 1,636 ms.
- Local checks after the Preview guard change passed: 59/59 tests, typecheck, lint, build, and `npm audit --omit=dev` with 0 vulnerabilities.
- Fresh Preview browser role UAT remains incomplete because the isolated branch has no test user. Earlier role-flow UAT was completed on an older Preview commit.

## Remaining release gates

1. Reconcile the active Production deployment's effective `DATABASE_URL` target with Neon Production `main` without disclosing the secret. Verify the app's `/api/notifications` route no longer returns 500 and inspect fresh runtime logs.
2. Keep the pre-release recovery branch. PITR is six hours; the branch restore path has not been exercised.
3. The separate Production VAPID pair is configured in Vercel Production; ensure the next release deployment receives the variables, then verify push delivery on a real Android device.
4. Complete role-based browser UAT against an isolated Preview user/branch after the current Preview deployment is refreshed.
5. Android tooling passed `bubblewrap doctor`, but no device is attached. APK signing, Digital Asset Links, APK build/install, and real-device push checks remain open.
6. Only after these gates pass, mark PR #1 ready, merge, and verify the Production deployment and core order/notification flows.

## Handoff summary

Production VAPID public/private keys are now configured as Vercel Production Secrets, with the subject as a Production Config variable. The active deployment has not yet been redeployed to receive them.

Production currently has migrations `0000`–`0011` on Neon project `neon-cinnabar-bucket` branch `main`, and the pre-migration recovery branch `pre-release-20261105` is retained. However, the live Production app still logs missing-table failures for `/api/notifications`. Treat Production as **partially migrated and not release-verified** until the runtime DB target is reconciled. Do not remove the recovery branch or switch the Production DB connection based on assumption.
