import { loadEnvConfig } from "@next/env";
import { createColdKeyCode } from "../src/lib/cold-key";

loadEnvConfig(process.cwd());

const challengeIndex = process.argv.indexOf("--challenge");
const challengeId = challengeIndex >= 0 ? process.argv[challengeIndex + 1] : "";
const secret = process.env.BETTER_AUTH_SECRET;

if (!/^[0-9a-f-]{36}$/i.test(challengeId)) {
  throw new Error("Supply the challenge shown in CENCOM: --challenge <uuid>.");
}
if (!secret || secret.length < 32) {
  throw new Error("BETTER_AUTH_SECRET was not provided by the selected Vercel environment.");
}

console.log(createColdKeyCode(secret, challengeId));
