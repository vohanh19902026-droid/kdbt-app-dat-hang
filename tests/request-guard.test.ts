import assert from "node:assert/strict";
import test from "node:test";
import { isCrossOriginRequest } from "../src/lib/request-guard";

function request(headers: Record<string, string>) {
  return new Request("https://kdbt.example.vn/api/orders", { method: "POST", headers });
}

test("same-origin browser POST is allowed", () => {
  assert.equal(isCrossOriginRequest(request({ host: "kdbt.example.vn", origin: "https://kdbt.example.vn" })), false);
});

test("a foreign origin is rejected", () => {
  assert.equal(isCrossOriginRequest(request({ host: "kdbt.example.vn", origin: "https://evil.example.com" })), true);
});

test("requests without Origin are not treated as CSRF", () => {
  assert.equal(isCrossOriginRequest(request({ host: "kdbt.example.vn" })), false);
});

test("a malformed Origin is rejected", () => {
  assert.equal(isCrossOriginRequest(request({ host: "kdbt.example.vn", origin: "not-a-url" })), true);
});

test("forwarded host from the platform is accepted", () => {
  assert.equal(isCrossOriginRequest(request({
    host: "internal:3000", "x-forwarded-host": "preview.vercel.app", origin: "https://preview.vercel.app",
  })), false);
});
