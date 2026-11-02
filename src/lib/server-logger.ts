/** Build a safe structured record without request bodies, credentials, or raw error messages. */
export function serverErrorRecord(event: string, error: unknown, request?: Request) {
  const requestId = request?.headers.get("x-vercel-id") || undefined;
  const errorName = error instanceof Error ? error.name : "UnknownError";
  return {
    level: "error",
    event,
    errorName,
    ...(requestId ? { requestId } : {}),
    timestamp: new Date().toISOString(),
  };
}

/** Emit compact structured logs without request bodies, credentials, or raw error messages. */
export function logServerError(event: string, error: unknown, request?: Request): void {
  console.error(JSON.stringify(serverErrorRecord(event, error, request)));
}
