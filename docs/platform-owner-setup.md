# Platform owner setup

The platform owner is an installation-specific, verified Google identity. Set PLATFORM_OWNER_EMAIL in the server environment for each deployment; do not commit a real operator email in source code.

## Preview bootstrap

1. Configure Google OAuth and set PLATFORM_OWNER_EMAIL on Preview.
2. Apply migrations to the isolated Preview database after confirming project, endpoint, and database name.
3. The configured identity signs in with Google and verifies its email. The bootstrap route is available only when VERCEL_ENV is preview, and it checks the linked Google account and single-owner constraint in a transaction.

## One-time database bootstrap

For controlled administration from a terminal, run npm run auth:bootstrap-platform-owner with SUP_ADMIN_TARGET_ENV and SUP_ADMIN_CONFIRM_TARGET_ENV set to the same environment. Set SUP_ADMIN_EMAIL to PLATFORM_OWNER_EMAIL and provide the separately confirmed Neon project, endpoint, and database metadata. Never print database URLs or secrets.

Production bootstrap additionally requires SUP_ADMIN_PRODUCTION_RELEASE_READY=YES and SUP_ADMIN_PRODUCTION_BACKUP_REFERENCE containing a verified backup reference. Do not bypass those release checks.

## User administration

The platform owner approves new registrations and grants the first regular Admin role. New Google registrations remain pending until approved. Do not share a common password or account among users.
