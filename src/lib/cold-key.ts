import { createHmac, timingSafeEqual } from "node:crypto";

export function createColdKeyCode(secret: string, challengeId: string): string {
  if (secret.length < 32) throw new Error("BETTER_AUTH_SECRET must contain at least 32 characters.");
  const digest = createHmac("sha256", secret).update(`cencom-cold-key-v1:${challengeId}`).digest();
  const number = BigInt(`0x${digest.subarray(0, 8).toString("hex")}`) % 10_000_000_000n;
  return number.toString().padStart(10, "0");
}

export function verifyColdKeyCode(expected: string, provided: string): boolean {
  if (!/^\d{10}$/.test(provided)) return false;
  const left = Buffer.from(expected, "ascii");
  const right = Buffer.from(provided, "ascii");
  return left.length === right.length && timingSafeEqual(left, right);
}
