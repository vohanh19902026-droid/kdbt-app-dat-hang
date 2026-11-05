# CENCOM production handoff assessment — 2026-11-05

## Release status

**Production web deployment is live and the database target has now been reconciled.** PR #1 was squash-merged to `main` at commit `d368a8a`. Vercel Production deployment `dpl_4xwwF7quiPXvuELf8YrySUMABjVw` is Ready and serves the primary `kdbt-app-dat-hang-five.vercel.app` alias.

The production build guard verified the effective database target against the independently configured Neon endpoint ID and database `neondb`. Build logs show migration dry-run and apply both found migrations `0000`–`0011` already applied, with 0 new files written. No database URL or credential was exposed.

## Production checks

- `GET /api/health` returned `{"status":"ok","database":"up"}`.
- An unauthenticated `GET /api/notifications` returned HTTP 401, as expected for an authenticated endpoint; the previous PostgreSQL 42P01 / HTTP 500 was not reproduced. An authenticated notification read/write flow was not exercised in this handoff.
- Recent Production runtime logs showed the PostgreSQL SSL-mode compatibility warning from the driver. No notification failure appeared in the request check.
- Separate Production VAPID public/private keys are configured as Vercel Secrets and the subject is Config. Values were never pulled or shown. Push delivery on a physical Android device remains unverified.

## Database recovery

- Neon Production project `neon-cinnabar-bucket`, branch `main`, database `neondb` contains the application schema and migrations `0000`–`0011`.
- Persistent copy-on-write recovery branch `pre-release-20261105` was created before the manual Production migrations and remains available.
- Neon reported a six-hour PITR window. Neither a branch restore nor a full rollback exercise was performed. Retain the recovery branch until an owner confirms the backup and recovery procedure.

## Preview and verification limits

- Preview remains connected to the isolated Neon project `cencom-preview-isolated`, not Production.
- Latest Preview deployment for commit `1b20dbf` reached Ready and its Vercel check succeeded. The login page loads.
- Fresh role-based Preview UAT could not be completed because the isolated branch has no test account. Earlier NVKD → planning → Admin flow evidence is from an older Preview build.
- Existing local evidence: 59/59 tests, typecheck, lint, build, and `npm audit --omit=dev` with 0 vulnerabilities. The latest Production build also compiled successfully.
- The Production request check was anonymous; business flows requiring an authenticated company account still need owner acceptance.

## Android APK status

- Bubblewrap 1.27.0 `doctor` passes; configured JDK and Android SDK paths are valid. SDK licenses were accepted with user authorization.
- No APK/AAB has been built or signed. Digital Asset Links is not published because the final application ID and signing certificate fingerprint are not fixed. No Android device is connected.
- TWA/APK install, role flow, push while foreground/background/closed, and real-device notification permission checks remain open.

## Handoff

The Production web app is deployed, the intended Neon Production database is verified by the build guard, and the public health/notification authorization smoke checks are healthy. Handoff is ready for operational use with the above acceptance limits: authenticated role-flow verification, tested DB recovery, and Android packaging/push validation are still outstanding. Keep `pre-release-20261105` until recovery ownership is confirmed.