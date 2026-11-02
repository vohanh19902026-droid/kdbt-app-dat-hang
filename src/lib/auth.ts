import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";

const secret = process.env.BETTER_AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters in production.");
}

export const auth = betterAuth({
  appName: "CENCOM Điều phối bê tông",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: secret || "local-development-secret-do-not-use-in-production-32chars",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { ...schema, user: schema.user },
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    requireEmailVerification: false,
    minPasswordLength: 10,
    maxPasswordLength: 128,
  },
  // Better Auth stores limits in memory by default. Keep login attempts low
  // for this small internal app; use shared storage if it scales to many instances.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "memory",
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },
  user: {
    additionalFields: {
      appRole: { type: "string", required: false, defaultValue: "SALES", input: false },
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
    },
  },
  plugins: [nextCookies(), admin({ defaultRole: "user", adminRoles: ["admin"] })],
  trustedOrigins: process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : ["http://localhost:3000"],
});
