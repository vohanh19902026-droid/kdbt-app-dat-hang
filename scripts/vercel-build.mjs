import { spawnSync } from "node:child_process";

function runNpm(args) {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) throw new Error("Vercel build script must be invoked through npm.");
  const result = spawnSync(process.execPath, [npmCli, ...args], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (process.env.VERCEL === "1" && process.env.VERCEL_ENV === "preview") {
  if (!process.env.DATABASE_URL) {
    throw new Error("Preview requires a Neon Preview Branch connection before migrations can run.");
  }
  runNpm(["run", "db:migrate"]);
}

runNpm(["run", "build"]);
