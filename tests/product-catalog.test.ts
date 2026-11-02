import assert from "node:assert/strict";
import test from "node:test";
import { defaultProductCatalog, normalizeProductCatalog, productCatalogSchema } from "../src/lib/product-catalog";

test("older workspace settings inherit the configurable booking catalog defaults", () => {
  assert.deepEqual(normalizeProductCatalog(undefined), defaultProductCatalog);
});

test("catalog values are trimmed and unique across every order field", () => {
  const parsed = productCatalogSchema.safeParse({
    grades: ["  M250  "], sandTypes: ["Cát vàng"], stoneTypes: ["Đá 1x2"],
    pumpTypes: ["Không bơm"], truckCapacitiesM3: [7], pourTypes: ["Sàn"],
  });
  assert.equal(parsed.success, true);
  if (parsed.success) assert.deepEqual(parsed.data.grades, ["M250"]);
  const duplicate = productCatalogSchema.safeParse({
    ...defaultProductCatalog, sandTypes: ["Cát vàng", " cát VÀNG "],
  });
  assert.equal(duplicate.success, false);
});

test("catalog requires at least one option per field and rejects invalid truck sizes", () => {
  assert.equal(productCatalogSchema.safeParse({ ...defaultProductCatalog, grades: [] }).success, false);
  assert.equal(productCatalogSchema.safeParse({ ...defaultProductCatalog, truckCapacitiesM3: [0] }).success, false);
});
