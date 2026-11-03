import { spawn } from "node:child_process";
import { resolve } from "node:path";
import process from "node:process";

// This entry point is intentionally pinned to a loopback PostgreSQL test DB.
// Never reuse .env.local's remote DATABASE_URL when exercising UAT locally.
const child = spawn(process.execPath, [resolve("node_modules/next/dist/bin/next"), "start", "--hostname", "127.0.0.1", "--port", "3104"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DATABASE_URL: "postgresql://postgres@127.0.0.1:55432/cencom_accounting_test",
    BETTER_AUTH_URL: "http://127.0.0.1:3104",
    BETTER_AUTH_SECRET: "local-demo-secret-only-32-characters-minimum",
  },
  stdio: "inherit",
});
child.on("error", (error) => { console.error("Could not start local UAT server:", error.message); process.exitCode = 1; });
child.on("exit", (code) => { process.exitCode = code ?? 1; });
