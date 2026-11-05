/** Require an independently configured, exact database target before Preview migrations. */
export function validatePreviewDatabase(env) {
  const expectedProjectId = env.PREVIEW_DATABASE_PROJECT_ID;
  const actualProjectId = env.DATABASE_NEON_PROJECT_ID;
  const expectedDatabase = env.PREVIEW_DATABASE_NAME;
  if (!expectedProjectId || !actualProjectId || !expectedDatabase || !env.DATABASE_URL) {
    throw new Error("Preview requires DATABASE_URL, matching Neon project IDs and PREVIEW_DATABASE_NAME before migrations can run.");
  }

  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("Preview DATABASE_URL is invalid.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname.toLowerCase().endsWith(".neon.tech") ||
      actualProjectId !== expectedProjectId ||
      url.pathname !== `/${encodeURIComponent(expectedDatabase)}`) {
    throw new Error("Preview database does not match the independently verified Neon project and database; migration blocked.");
  }
}
