import assert from "node:assert/strict";
import test from "node:test";
import { validatePreviewDatabase } from "../scripts/verify-preview-database.mjs";

const expected = { PREVIEW_DATABASE_HOST: "uat.example.test", PREVIEW_DATABASE_NAME: "cencom_uat" };

test("Preview migration requires the independently configured target", () => {
  validatePreviewDatabase({ ...expected, DATABASE_URL: "postgresql://user:secret@uat.example.test/cencom_uat" });
  for (const databaseUrl of [
    "postgresql://user:secret@production.example.test/cencom_uat",
    "postgresql://user:secret@uat.example.test/neondb",
    "https://uat.example.test/cencom_uat",
    "invalid",
  ]) {
    assert.throws(() => validatePreviewDatabase({ ...expected, DATABASE_URL: databaseUrl }),
      (error) => !error.message.includes("secret"));
  }
  assert.throws(() => validatePreviewDatabase({ DATABASE_URL: "postgresql://user:secret@uat.example.test/cencom_uat" }));
});
