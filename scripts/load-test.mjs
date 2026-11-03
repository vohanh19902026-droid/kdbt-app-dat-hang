import os from "node:os";
import process from "node:process";

function flag(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

const rawUrl = flag("--url", "");
const concurrency = Number(flag("--concurrency", "10"));
const durationSeconds = Number(flag("--duration-seconds", "10"));
if (!rawUrl) throw new Error("Usage: npm run load:test -- --url http://127.0.0.1:3103/api/health [--concurrency 10] [--duration-seconds 10]");
const url = new URL(rawUrl);
if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 100) throw new Error("Concurrency must be between 1 and 100.");
if (!Number.isInteger(durationSeconds) || durationSeconds < 1 || durationSeconds > 30) throw new Error("Duration must be between 1 and 30 seconds.");
const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
if (!local && (process.env.LOAD_TEST_ALLOW_REMOTE !== "1" || process.env.LOAD_TEST_CONFIRM_ENV !== "preview")) {
  throw new Error("Remote load is disabled. Only an explicitly approved Preview is allowed: set LOAD_TEST_ALLOW_REMOTE=1 and LOAD_TEST_CONFIRM_ENV=preview.");
}
if (url.protocol !== "https:" && !local) throw new Error("Remote load URL must use HTTPS.");
if (["kdbt-app-dat-hang-five.vercel.app", "kdbt-app-dat-hang.vercel.app"].includes(url.hostname)) throw new Error("Production URLs are blocked by this load test tool.");

const cookie = process.env.LOAD_TEST_COOKIE;
const durations = [];
const outcomes = new Map();
let requests = 0;
let bytes = 0;
let failures = 0;
const deadline = Date.now() + durationSeconds * 1000;

async function worker() {
  while (Date.now() < deadline) {
    const started = performance.now();
    try {
      const response = await fetch(url, { headers: cookie ? { cookie } : undefined, cache: "no-store", signal: AbortSignal.timeout(8000) });
      const data = await response.arrayBuffer();
      bytes += data.byteLength;
      requests += 1;
      outcomes.set(response.status, (outcomes.get(response.status) ?? 0) + 1);
      durations.push(performance.now() - started);
      if (!response.ok) failures += 1;
    } catch {
      requests += 1; failures += 1;
      outcomes.set("network-error", (outcomes.get("network-error") ?? 0) + 1);
      durations.push(performance.now() - started);
    }
  }
}

const beganAt = Date.now();
await Promise.all(Array.from({ length: concurrency }, () => worker()));
const elapsedSeconds = (Date.now() - beganAt) / 1000;
durations.sort((a, b) => a - b);
const percentile = (p) => durations.length ? Math.round(durations[Math.min(durations.length - 1, Math.ceil(durations.length * p) - 1)]) : 0;
const mean = durations.length ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length) : 0;
console.log(JSON.stringify({
  target: `${url.origin}${url.pathname}`,
  host: os.hostname(),
  environment: local ? "local" : "preview",
  concurrency,
  durationSeconds: Number(elapsedSeconds.toFixed(2)),
  requests,
  requestsPerSecond: Number((requests / elapsedSeconds).toFixed(2)),
  latencyMs: { p50: percentile(0.5), p95: percentile(0.95), mean },
  errors: failures,
  errorRatePercent: Number((failures / Math.max(1, requests) * 100).toFixed(2)),
  responseBytes: bytes,
  statusCounts: Object.fromEntries(outcomes),
}, null, 2));
if (!requests || failures > 0) process.exitCode = 1;
