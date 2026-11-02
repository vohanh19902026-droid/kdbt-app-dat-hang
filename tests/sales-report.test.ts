import assert from "node:assert/strict";
import test from "node:test";
import { groupProductionByCustomerAndSales } from "../src/lib/sales-report";

test("production report keeps one customer separate when sales ownership differs", () => {
  const groups = groupProductionByCustomerAndSales([
    { customerName: "Công trình A", salesRepName: "NVKD 1", quantityM3: "10", actualM3: "8" },
    { customerName: "Công trình A", salesRepName: "NVKD 2", quantityM3: "5", actualM3: "5" },
  ]);

  assert.deepEqual(groups, [
    { customerName: "Công trình A", salesRepName: "NVKD 1", count: 1, ordered: 10, actual: 8 },
    { customerName: "Công trình A", salesRepName: "NVKD 2", count: 1, ordered: 5, actual: 5 },
  ]);
});

test("production report combines bookings for the same customer and sales rep", () => {
  const groups = groupProductionByCustomerAndSales([
    { customerName: "Công trình A", salesRepName: "NVKD 1", quantityM3: 10, actualM3: 8 },
    { customerName: "Công trình A", salesRepName: "NVKD 1", quantityM3: 5, actualM3: 4 },
  ]);

  assert.deepEqual(groups, [
    { customerName: "Công trình A", salesRepName: "NVKD 1", count: 2, ordered: 15, actual: 12 },
  ]);
});
