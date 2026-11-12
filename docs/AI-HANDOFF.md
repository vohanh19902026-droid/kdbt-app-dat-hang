# AI handoff — CENCOM concrete ordering app

Last updated: 12 November 2026

## Start here

- Repository: `https://github.com/vohanh19902026-droid/kdbt-app-dat-hang`
- Handoff ref: `handoff/cencom-2026-11-12`
- Handoff commit: `619126004dfe40e3480dd1aedcf02636bf194417`
- Local project path used by the owner: `E:\DỰ ÁN CÔNG TY\3. kdbt-app-dat-hang`
- Do not assume GitHub `main` contains this handoff. Remote `main` is still at `6037661`.

The handoff ref includes local release commit `698ede0`, booking performance commit `1ace62e`, and this handoff note. `.env.local`, database credentials, raw workbooks, and private staging data are not in Git.

## What is in this version

- GD1 app changes consolidated in `698ede0`, including Google registration with Admin approval, password recovery, legacy debt review screens/import support, and platform-owner bootstrap/schema work.
- Booking list uses server-side pagination with **20 rows per page**, server-side search/status filters, aggregate KPIs, URL-persisted paging/search, and customer lookup API capped at 30 results (`1ace62e`). It avoids loading the full active customer list when opening the page.
- Request-scoped `cache` wrappers reduce duplicate session/settings reads.
- GD2 source assessment, import/review design, checklist, and historical review-only data code are documented in `docs/phase2-concrete-data-assessment.md`, `docs/cencom-gd1-gd2-todo.md`, and the related scripts/routes.

## Current release state and known blocker

- Do not equate a successful Vercel build with a working release. A direct Production deployment built `READY`, but browser smoke found `/orders` failing because Production DB lacks `user.is_platform_owner` (Postgres `42703`). Migration `drizzle/0013_platform_owner.sql` adds it.
- Previous work reported that the Production alias was rolled back to stable deployment `dpl_GEzr5DWujDfgerJE2iompH5PQuHU`; Vercel project metadata later showed another READY Production deployment (`dpl_7bFpNSKrgoVezRV78mcvxAE2AJdb`). **First verify which deployment the public Production domain currently serves.** Do not rely on the deployment list alone.
- The commit that adds code/migrations has not been pushed to remote `main`; remote `main` remains `6037661`. Vercel is connected to this GitHub repo, so pushing `main` may automatically deploy to Production.
- Production migrations have not been verified/applied. The guarded local attempt stopped before SQL because the configured endpoint could not be verified against the Production target. Do not bypass the target guard or substitute another Neon URL.
- Google OAuth, SMTP password recovery, and Web Push are not confirmed configured and verified in Production. Do not claim those flows are production-ready.
- The app's legacy history records in Neon Production were described in the checklist as review-only: 4,411 entities and 8,243 observations, with observations still `PENDING_HUMAN_REVIEW` / `UNCONFIRMED_SOURCE_UNIT`. They are not approved customer/debt ledger data.
- The exact 20-row changes are in the handoff branch but have not been verified on a Vercel deployment or measured against the remote Production database.

## Next work, in order

1. Read `AGENTS.md`, `docs/cencom-gd1-gd2-todo.md`, `docs/release-assessment-2026-11-03.md`, `docs/release-process.md`, and `docs/phase2-concrete-data-assessment.md`. Preserve the raw Excel files unchanged.
2. Reconfirm the live Production alias and current DB schema using the approved Vercel/Neon interface. Keep credentials inside provider dashboards; never request or print secrets in chat, terminal output, logs, commits, or the handoff.
3. Complete the minimum safe path for `0013_platform_owner.sql`: verify the exact Production endpoint through the existing guard, inspect migration state, apply only the needed migration, and verify schema/app behavior. If the target cannot be proven, stop before writing.
4. Run the repository checks on the exact handoff commit: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `git diff --check`. Fix failures and record results. (The latest performance change has prior typecheck/lint/diff-check evidence; a full current-commit run is still required.)
5. Verify the real sign-in, `/orders` 20-row paging, customer search, create/edit booking, and role permissions end to end on a deployment that uses the verified database. Measure first and warm page load, response sizes, and API/DB times; separate local synthetic benchmarks from real Vercel results.
6. Verify email reset and Google registration only if the relevant Production OAuth/SMTP settings are configured. Keep unconfigured flows explicitly marked unavailable; do not weaken access controls to make a demo pass.
7. Update the TODO and release assessment with evidence. Promote the reviewed commit only after the Production migration and smoke checks succeed; then confirm the actual public domain serves it. Do not push `main` before considering the automatic Production deployment effect.
8. GD2 remains a human-review workflow. Keep source lineage and review state, separate DA from DC, do not recalculate accounting rules, and do not convert estimates/unconfirmed observations into approved balances. Never commit source workbook, SQLite staging, exported customer data, or credentials.

## Working agreements for the next AI

- Continue from `handoff/cencom-2026-11-12`; do not create extra long-lived branches without need. Keep Production and Preview databases strictly distinguished.
- Do not send emails, messages, or expose credentials. Do not read passwords or one-time verification codes from Gmail or paste them into chat.
- The user prefers direct progress, concise status, and checking completed work in the TODO as each step finishes. Ask only when a choice or owner action is genuinely required.
- The user asked for a ready-to-transfer product. Make progress toward that outcome, but report real blockers clearly instead of calling an unverified release ready.

## Key files

- `docs/cencom-gd1-gd2-todo.md` — chronological progress checklist.
- `docs/release-assessment-2026-11-03.md` — release gate and prior findings.
- `docs/release-process.md` — release procedure.
- `docs/phase2-concrete-data-assessment.md` — GD2 source mapping and review limitations.
- `drizzle/0013_platform_owner.sql` — known missing Production schema change.
- `scripts/verify-production-database.mjs` and `scripts/migration-target-policy.mjs` — target safety checks; preserve these protections.
- `src/app/(workspace)/orders/page.tsx`, `src/components/orders-workspace.tsx`, `src/app/api/customers/lookup/route.ts` — 20-row pagination and customer search implementation.
