/** Require an independently configured, exact database target before Production migrations. */
export function validateProductionDatabase(env) {
  const expectedEndpointId = env.PRODUCTION_DATABASE_ENDPOINT_ID;
  const expectedDatabase = env.PRODUCTION_DATABASE_NAME;
  if (!expectedEndpointId || !expectedDatabase || !env.DATABASE_URL) {
    throw new Error("Production requires DATABASE_URL, PRODUCTION_DATABASE_ENDPOINT_ID and PRODUCTION_DATABASE_NAME before migrations can run.");
  }

  let url;
  try {
    url = new URL(env.DATABASE_URL);
  } catch {
    throw new Error("Production DATABASE_URL is invalid.");
  }

  const hostname = url.hostname.toLowerCase();
  const endpointId = hostname.split(".")[0]?.replace(/-pooler$/, "");
  if (!["postgres:", "postgresql:"].includes(url.protocol) ||
      !hostname.endsWith(".neon.tech") ||
      endpointId !== expectedEndpointId ||
      url.pathname !== `/${encodeURIComponent(expectedDatabase)}`) {
    throw new Error("Production database target does not match the independently verified Neon endpoint and database; migration blocked.");
  }

  console.log(`[production-db-guard] Verified Neon target ${hostname}/${expectedDatabase}.`);
}
