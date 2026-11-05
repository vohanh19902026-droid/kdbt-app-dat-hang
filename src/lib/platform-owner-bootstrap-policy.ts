export const PLATFORM_OWNER_EMAIL = "vohanh19902026@gmail.com";

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
