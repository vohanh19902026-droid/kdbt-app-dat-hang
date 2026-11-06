/** Keep Production migrations explicit and forbid dry-runs against Production. */
export function resolveMigrationTarget(env, args) {
  const explicitProduction = args.includes("--production");
  const dryRun = args.includes("--dry");

  if (env.VERCEL_ENV === "production" && !explicitProduction) {
    throw new Error("Production migrations require the explicit --production flag.");
  }
  if (env.VERCEL_ENV === "preview" && explicitProduction) {
    throw new Error("The --production flag cannot be used in a Preview deployment.");
  }
  if (dryRun && (env.VERCEL_ENV === "production" || explicitProduction)) {
    throw new Error("Production dry-runs are disabled; run dry-runs only against an isolated Preview database.");
  }

  if (explicitProduction) return "production";
  if (env.VERCEL_ENV === "preview") return "preview";
  return "local";
}
