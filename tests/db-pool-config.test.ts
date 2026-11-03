import assert from "node:assert/strict";
import test from "node:test";
import { getDbPoolMax } from "../src/lib/db-pool-config";

test("database pool uses a conservative serverless default", () => {
  assert.equal(getDbPoolMax(undefined), 2);
  assert.equal(getDbPoolMax(""), 2);
  assert.equal(getDbPoolMax("invalid"), 2);
  assert.equal(getDbPoolMax("0"), 2);
  assert.equal(getDbPoolMax("2"), 2);
});

test("database pool setting is bounded to avoid unplanned connection fanout", () => {
  assert.equal(getDbPoolMax("8"), 8);
  assert.equal(getDbPoolMax("100"), 20);
  assert.equal(getDbPoolMax("1.5"), 2);
});
