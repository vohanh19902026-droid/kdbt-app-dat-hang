import assert from "node:assert/strict";
import { test } from "node:test";
import { getAuthBaseURL } from "../src/lib/auth-base-url";

test("auth uses its explicit URL before the Vercel deployment URL", () => {
  assert.equal(
    getAuthBaseURL({ BETTER_AUTH_URL: "https://orders.example.vn", VERCEL_URL: "preview.vercel.app" }),
    "https://orders.example.vn",
  );
});

test("auth derives a valid origin for Vercel Preview deployments", () => {
  assert.equal(getAuthBaseURL({ VERCEL_URL: "kdbt-preview.vercel.app" }), "https://kdbt-preview.vercel.app");
});

test("auth keeps localhost as the local development fallback", () => {
  assert.equal(getAuthBaseURL({}), "http://localhost:3000");
});
