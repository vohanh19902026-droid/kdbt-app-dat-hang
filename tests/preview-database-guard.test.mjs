import assert from "node:assert/strict";
import test from "node:test";
import { validatePreviewDatabase } from "../scripts/verify-preview-database.mjs";

const expected = {
  PREVIEW_DATABASE_PROJECT_ID: "winter-river-11456796",
  DATABASE_NEON_PROJECT_ID: "winter-river-11456796",
  PREVIEW_DATABASE_NAME: "neondb",
};

test("Preview migration requires the independently configured target", () => {
  validatePreviewDatabase({ ...expected, DATABASE_URL: "postgresql://user:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb" });
  for (const databaseUrl of [
    "postgresql://user:secret@production.example.test/neondb",
    "postgresql://user:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/cencom_uat",
    "https://ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb",
    "invalid",
  ]) {
    assert.throws(() => validatePreviewDatabase({ ...expected, DATABASE_URL: databaseUrl }),
      (error) => !error.message.includes("secret"));
  }
  assert.throws(() => validatePreviewDatabase({ ...expected, DATABASE_NEON_PROJECT_ID: "purple-shadow-60251840", DATABASE_URL: "postgresql://user:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb" }));
  assert.throws(() => validatePreviewDatabase({ DATABASE_URL: "postgresql://user:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb" }));
});
