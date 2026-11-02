import assert from "node:assert/strict";
import test from "node:test";
import { serverErrorRecord } from "../src/lib/server-logger";

test("server error records are structured and omit raw exception messages", () => {
  const request = new Request("https://app.example/api", { headers: { "x-vercel-id": "region::request-123" } });
  const record = serverErrorRecord("accounting_entry_create_failed", new Error("password=private DATABASE_URL=secret"), request);
  const serialized = JSON.stringify(record);
  assert.deepEqual({ level: record.level, event: record.event, errorName: record.errorName, requestId: record.requestId }, {
    level: "error", event: "accounting_entry_create_failed", errorName: "Error", requestId: "region::request-123",
  });
  assert.equal(serialized.includes("private"), false);
  assert.equal(serialized.includes("DATABASE_URL"), false);
});
