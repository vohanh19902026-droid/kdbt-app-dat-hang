/** Require an independently configured, exact database target before Preview migrations. */
export function validatePreviewDatabase(env) {
  const expectedHost = env.PREVIEW_DATABASE_HOST;
  const expectedDatabase = env.PREVIEW_DATABASE_NAME;
  if (!expectedHost || !expectedDatabase || !env.DATABASE_URL) {
    throw new Error("Preview requires DATABASE_URL, PREVIEW_DATABASE_HOST and PREVIEW_DATABASE_NAME before migrations can run.");
  }

  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("Preview DATABASE_URL is invalid.");
  }
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      url.hostname !== expectedHost.toLowerCase() ||
      url.pathname !== `/${encodeURIComponent(expectedDatabase)}`) {
    throw new Error("Preview database does not match the independently verified host and database; migration blocked.");
  }
}
