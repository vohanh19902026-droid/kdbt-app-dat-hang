import { loadEnvConfig } from "@next/env";
import { and, eq, sql } from "drizzle-orm";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

async function main() {
  loadEnvConfig(process.cwd());

  const ownerEmail = required("PLATFORM_OWNER_EMAIL").toLowerCase();
  const target = required("SUP_ADMIN_TARGET_ENV").toUpperCase();
  const confirmation = required("SUP_ADMIN_CONFIRM_TARGET_ENV").toUpperCase();
  if (!["PREVIEW", "PRODUCTION"].includes(target) || confirmation !== target) {
    throw new Error("Target confirmation mismatch; no account was changed.");
  }
  if (process.env.SUP_ADMIN_EMAIL?.trim().toLowerCase() !== ownerEmail) {
    throw new Error("SUP_ADMIN_EMAIL must match the configured owner identity.");
  }

  const databaseUrl = required(target === "PREVIEW" ? "PREVIEW_DATABASE_URL" : "DATABASE_URL");
  const parsedUrl = new URL(databaseUrl);
  if (!parsedUrl.hostname.endsWith(".neon.tech")) {
    throw new Error("Database host is not a Neon endpoint; no account was changed.");
  }
  const actualEndpoint = parsedUrl.hostname.split(".")[0].replace(/-pooler$/, "");
  if (actualEndpoint !== required("SUP_ADMIN_EXPECTED_NEON_ENDPOINT_ID")) {
    throw new Error("Neon endpoint does not match the explicitly confirmed target.");
  }
  const actualDatabase = decodeURIComponent(parsedUrl.pathname.replace(/^\//, ""));
  if (actualDatabase !== required("SUP_ADMIN_EXPECTED_DATABASE")) {
    throw new Error("Database name does not match the explicitly confirmed target.");
  }
  const configuredDatabase = target === "PREVIEW" ? process.env.PREVIEW_DATABASE_NAME : process.env.PRODUCTION_DATABASE_NAME;
  if (!configuredDatabase || configuredDatabase !== actualDatabase) {
    throw new Error("Database does not match the configured environment target.");
  }
  const actualProject = process.env.DATABASE_NEON_PROJECT_ID || process.env.NEON_PROJECT_ID;
  if (!actualProject || actualProject !== required("SUP_ADMIN_EXPECTED_NEON_PROJECT_ID")) {
    throw new Error("Neon project ID does not match the explicitly confirmed target.");
  }
  if (target === "PREVIEW" && process.env.PREVIEW_DATABASE_PROJECT_ID !== actualProject) {
    throw new Error("Preview project guard failed; refusing to bootstrap against another database.");
  }
  if (target === "PRODUCTION" && (
    process.env.SUP_ADMIN_PRODUCTION_RELEASE_READY !== "YES" ||
    !process.env.SUP_ADMIN_PRODUCTION_BACKUP_REFERENCE?.trim()
  )) {
    throw new Error("Production bootstrap requires a verified release gate and backup reference.");
  }

  // The shared db module uses DATABASE_URL locally, while Vercel Preview selects
  // PREVIEW_DATABASE_URL. Point this one-shot bootstrap at the confirmed target.
  process.env.DATABASE_URL = databaseUrl;
  const [{ db }, schema] = await Promise.all([import("../src/db"), import("../src/db/schema")]);
  try {
    await db.transaction(async (tx) => {
      const [candidate] = await tx.select({
        id: schema.user.id,
        emailVerified: schema.user.emailVerified,
        isPlatformOwner: schema.user.isPlatformOwner,
      }).from(schema.user).where(sql`lower(${schema.user.email}) = ${ownerEmail}`).limit(1);

      if (!candidate || !candidate.emailVerified) {
        throw new Error("Owner account not found or email is not verified. Sign in with the verified Google account first.");
      }
      const [googleAccount] = await tx.select({ id: schema.account.id }).from(schema.account).where(and(
        eq(schema.account.userId, candidate.id),
        eq(schema.account.providerId, "google"),
      )).limit(1);
      if (!googleAccount) throw new Error("The verified Google identity is not linked to this account.");

      const [existingOwner] = await tx.select({ id: schema.user.id }).from(schema.user)
        .where(eq(schema.user.isPlatformOwner, true)).limit(1);
      if (existingOwner && existingOwner.id !== candidate.id) {
        throw new Error("A different platform owner already exists; no account was changed.");
      }

      await tx.update(schema.user).set({
        isPlatformOwner: true,
        appRole: "ADMIN",
        role: "admin",
        isActive: true,
        requestedAppRole: null,
        updatedAt: new Date(),
      }).where(eq(schema.user.id, candidate.id));
    });
    console.log(`Platform owner bootstrap completed for ${ownerEmail} on ${target}. No password was set or changed.`);
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Platform owner bootstrap failed.");
  process.exitCode = 1;
});
