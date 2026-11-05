import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";
import { eq } from "drizzle-orm";
import { after } from "next/server";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getAuthBaseURL } from "@/lib/auth-base-url";
import { sendPasswordResetEmail } from "@/lib/email";

const secret = process.env.BETTER_AUTH_SECRET;
const baseURL = getAuthBaseURL();
if (process.env.NODE_ENV === "production" && (!secret || secret.length < 32)) {
  throw new Error("BETTER_AUTH_SECRET must be set to at least 32 characters in production.");
}

export const auth = betterAuth({
  appName: "CENCOM Điều phối bê tông",
  baseURL,
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
    resetPasswordTokenExpiresIn: 30 * 60,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const [account] = await db.select({ isActive: schema.user.isActive })
        .from(schema.user)
        .where(eq(schema.user.id, user.id))
        .limit(1);
      if (!account?.isActive) return;
      after(async () => {
        try {
          await sendPasswordResetEmail({ to: user.email, url });
        } catch {
          console.error("[auth] Password reset email delivery failed.");
        }
      });
    },
  },
  socialProviders: process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          requireEmailVerification: true,
        },
      }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (newUser, context) => {
          // Google sign-ups get the least-privileged app role and require Admin activation.
          if (context?.path?.includes("/callback/google")) {
            return { data: { ...newUser, appRole: "SALES", isActive: false } };
          }
        },
      },
    },
      // Pending Google registrations need a limited session to submit their
      // profile and view approval status. Business access is gated in session.ts.
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
      "/request-password-reset": { window: 300, max: 3 },
    },
  },
  user: {
    additionalFields: {
      appRole: { type: "string", required: false, defaultValue: "SALES", input: false },
      isActive: { type: "boolean", required: false, defaultValue: true, input: false },
      isPlatformOwner: { type: "boolean", required: false, defaultValue: false, input: false },
    },
  },
  plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] }), nextCookies()],
  trustedOrigins: [baseURL],
});
