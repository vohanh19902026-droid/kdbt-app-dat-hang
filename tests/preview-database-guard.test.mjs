import assert from "node:assert/strict";
import test from "node:test";
import { getDatabaseUrl, validatePreviewDatabase } from "../scripts/verify-preview-database.mjs";

const expected = {
  PREVIEW_DATABASE_PROJECT_ID: "winter-river-11456796",
  PREVIEW_DATABASE_ENDPOINT_ID: "ep-preview",
  DATABASE_NEON_PROJECT_ID: "winter-river-11456796",
  PREVIEW_DATABASE_NAME: "neondb",
};

test("Preview migration requires the independently configured target", () => {
  validatePreviewDatabase({ ...expected, PREVIEW_DATABASE_URL: "postgresql://user:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb" });
  for (const databaseUrl of [
    "postgresql://user:secret@production.example.test/neondb",
    "postgresql://user:secret@ep-other-branch.c-4.ap-southeast-1.aws.neon.tech/neondb",
    "postgresql://user:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/cencom_uat",
    "https://ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb",
    "invalid",
  ]) {
    assert.throws(() => validatePreviewDatabase({ ...expected, PREVIEW_DATABASE_URL: databaseUrl }),
      (error) => !error.message.includes("secret"));
  }
  const correctUrl = "postgresql://user:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb";
  assert.throws(() => validatePreviewDatabase({ ...expected, DATABASE_NEON_PROJECT_ID: "purple-shadow-60251840", PREVIEW_DATABASE_URL: correctUrl }));
  assert.throws(() => validatePreviewDatabase({ ...expected, PREVIEW_DATABASE_ENDPOINT_ID: "ep-other-branch", PREVIEW_DATABASE_URL: correctUrl }));
  assert.throws(() => validatePreviewDatabase({ ...expected, DATABASE_URL: correctUrl }));
});

test("Preview selects its dedicated database URL over Neon integration variables", () => {
  const pinned = "postgresql://preview:secret@ep-preview.c-4.ap-southeast-1.aws.neon.tech/neondb";
  const integration = "not-a-postgresql-url";
  assert.equal(getDatabaseUrl({ VERCEL_ENV: "preview", PREVIEW_DATABASE_URL: pinned, DATABASE_URL: integration }), pinned);
  assert.equal(getDatabaseUrl({ VERCEL_ENV: "production", PREVIEW_DATABASE_URL: pinned, DATABASE_URL: integration }), integration);
});
