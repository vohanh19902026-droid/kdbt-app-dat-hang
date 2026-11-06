type AuthUrlEnvironment = {
  BETTER_AUTH_URL?: string;
  VERCEL_BRANCH_URL?: string;
  VERCEL_URL?: string;
};

export function getAuthBaseURL(env: AuthUrlEnvironment = {
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  VERCEL_BRANCH_URL: process.env.VERCEL_BRANCH_URL,
  VERCEL_URL: process.env.VERCEL_URL,
}): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;
  if (env.VERCEL_BRANCH_URL) return `https://${env.VERCEL_BRANCH_URL}`;
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  return "http://localhost:3000";
}
