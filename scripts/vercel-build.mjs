import { spawnSync } from "node:child_process";
import { validatePreviewDatabase } from "./verify-preview-database.mjs";
import { validateProductionDatabase } from "./verify-production-database.mjs";

function runNpm(args) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("Vercel build script must be invoked through npm.");
  const result = spawnSync(process.execPath, [npmCli, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview") {
  validatePreviewDatabase(process.env);
  runNpm(["run", "db:migrate"]);
}

if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "production") {
  validateProductionDatabase(process.env);
  runNpm(["run", "db:migrate:dry"]);
  runNpm(["run", "db:migrate"]);
}

runNpm(["run", "build"]);
