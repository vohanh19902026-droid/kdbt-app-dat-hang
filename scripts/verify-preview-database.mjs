/** Require an independently configured, exact database target before Preview migrations. */
export function getDatabaseUrl(env) {
  return env.VERCEL_ENV === "preview" ? env.PREVIEW_DATABASE_URL : env.DATABASE_URL;
}

export function validatePreviewDatabase(env) {
  const expectedProjectId = env.PREVIEW_DATABASE_PROJECT_ID;
  const actualProjectId = env.DATABASE_NEON_PROJECT_ID;
  const expectedEndpointId = env.PREVIEW_DATABASE_ENDPOINT_ID;
  const expectedDatabase = env.PREVIEW_DATABASE_NAME;
  const databaseUrl = env.PREVIEW_DATABASE_URL;
  if (!expectedProjectId || !actualProjectId || !expectedEndpointId || !expectedDatabase || !databaseUrl) {
    throw new Error("Preview requires PREVIEW_DATABASE_URL, matching Neon project IDs, PREVIEW_DATABASE_ENDPOINT_ID and PREVIEW_DATABASE_NAME before migrations can run.");
  }

  let url;
  try {
    url = new URL(databaseUrl);
  } catch {
    const input = String(databaseUrl);
    const diagnostics = {
      postgresScheme: /^postgres(?:ql)?:\/\//i.test(input),
      leadingOrTrailingWhitespace: input !== input.trim(),
      containsWhitespace: /\s/.test(input),
      containsQuotes: /["'`]/.test(input),
    };
    throw new Error(`Preview PREVIEW_DATABASE_URL is invalid (${JSON.stringify(diagnostics)}).`);
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
