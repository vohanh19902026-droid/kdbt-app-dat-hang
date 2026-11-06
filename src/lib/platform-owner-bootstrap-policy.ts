// Configure the trusted bootstrap identity per installation. The reserved
// fallback can never be a real Google account, so missing configuration fails closed.
export const PLATFORM_OWNER_EMAIL = process.env.PLATFORM_OWNER_EMAIL?.trim().toLowerCase() || "owner@example.invalid";

export function canBootstrapPlatformOwner(input: {
  vercelEnvironment?: string;
  userId?: string;
  email?: string;
  emailVerified: boolean;
  googleAccountLinked: boolean;
  existingOwnerId?: string | null;
}): boolean {
  return input.vercelEnvironment === "preview" &&
    Boolean(input.userId) &&
    input.email?.trim().toLowerCase() === PLATFORM_OWNER_EMAIL &&
    input.emailVerified &&
    input.googleAccountLinked &&
    (!input.existingOwnerId || input.existingOwnerId === input.userId);
}
