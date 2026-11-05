# CENCOM production handoff assessment — 2026-11-05

## Release state

**Not released to Production.** The release branch is pushed and a Preview deployment is ready. Production database target and migration history do not reconcile across Vercel and Neon, and the live application currently returns errors from its notification count endpoint. No Production database migration or deployment was performed in this handoff.

## Delivered and verified

- Branch `feature/notifications-scale-android` is pushed through commit `6611ab3`.
- Vercel Preview deployment for commit `6611ab3` reached Ready. Neon created branch `preview/feature/notifications-scale-android` with parent `main` and linked it to that deployment in the separate Preview project `cencom-preview-isolated`.
- Preview build migration skipped `0000`–`0010` and applied `0011_fix_default_sand_catalog_typo.sql`.
- Preview read-only health load: concurrency 10, 85 requests, 0 errors, 10.91 seconds; request p95 3,714 ms and database round-trip p95 1,636 ms.
- Local checks after the Preview guard change: 59/59 tests, typecheck, lint, build and `npm audit --omit=dev` (0 vulnerabilities).
- The Preview migration guard now checks the expected Neon project ID, database name and Neon hostname. The Vercel Preview environment has `PREVIEW_DATABASE_PROJECT_ID=winter-river-11456796` and `PREVIEW_DATABASE_NAME=neondb`; the Neon integration provides the matching Preview project ID.

## Production blockers

1. **Live error:** Vercel runtime logs for the current Production deployment repeatedly show `GET /api/notifications` failing because `app_notifications` does not exist.
2. **Database identity/history mismatch:** a read-only check in Neon Production project `neon-cinnabar-bucket`, branch `main`, showed only migrations `0000`–`0004` and no `app_notifications` table. A dry-run through the current Vercel Production environment instead resolved a different database target and reported only migration `0011` pending. These results conflict, so the current Vercel Production `DATABASE_URL` must be reconciled with the live deployment's actual database before migration or deployment.
3. **Recovery:** Neon Production shows a six-hour point-in-time history window. One manual snapshot from about 15 hours earlier exists; no snapshot schedule is set. A restore/rollback exercise has not been completed.
4. **Push:** Production VAPID keys are not configured. Preview has separate VAPID configuration, but push delivery has not been verified on a real Android device.
5. **Fresh browser UAT:** the current Preview app reaches its login screen, but the clean Preview branch has no test user. Browser role-flow UAT was previously completed on an older Preview commit, not `6611ab3`.
6. **Android package:** `bubblewrap doctor` passed after SDK licenses were accepted, but no Android device is attached. APK signing, Digital Asset Links and device push checks remain open.

## Handoff sequence

1. Confirm which Neon project/branch the active Production deployment actually uses; align Vercel Production `DATABASE_URL` with that branch and rerun a read-only migration dry-run against the same target.
2. Confirm a current restore point and the exact rollback path before touching Production.
3. Bootstrap disposable users on the linked Preview branch and rerun the role-based browser UAT on the ready deployment. Run real Android push tests after Production VAPID is configured.
4. Review and merge the draft PR, then migrate and deploy only after the prior checks agree on one Production database target.

Production `main`, its database and the Production deployment were left unchanged by this handoff.
