/** Require an independently configured, exact database target before Preview migrations. */
export function validatePreviewDatabase(env) {
  const expectedProjectId = env.PREVIEW_DATABASE_PROJECT_ID;
  const actualProjectId = env.DATABASE_NEON_PROJECT_ID;
  const expectedEndpointId = env.PREVIEW_DATABASE_ENDPOINT_ID;
  const expectedDatabase = env.PREVIEW_DATABASE_NAME;
  if (!expectedProjectId || !actualProjectId || !expectedEndpointId || !expectedDatabase || !env.DATABASE_URL) {
    throw new Error("Preview requires DATABASE_URL, matching Neon project IDs, PREVIEW_DATABASE_ENDPOINT_ID and PREVIEW_DATABASE_NAME before migrations can run.");
  }

  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("Preview DATABASE_URL is invalid.");
  }
  const hostname = url.hostname.toLowerCase();
  const actualEndpointId = hostname.split(".")[0]?.replace(/-pooler$/, "");
  const checks = {
    postgresUrl: ["postgres:", "postgresql:"].includes(url.protocol),
    neonHost: hostname.endsWith(".neon.tech"),
    projectMatches: actualProjectId === expectedProjectId,
    endpointMatches: actualEndpointId === expectedEndpointId,
    databaseMatches: url.pathname === `/${encodeURIComponent(expectedDatabase)}`,
  };
  if (Object.values(checks).some((matches) => !matches)) {
    throw new Error(`Preview database target mismatch (${JSON.stringify({ ...checks, actualEndpointId, expectedEndpointId })}); migration blocked.`);
  }
}
