import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { createPlanWorkbook, type PlanExportOrder } from "../src/lib/plan-workbook";

const exampleOrder: PlanExportOrder = {
  bookingNo: "BOOK-7431",
  customerName: "Công trình thử nghiệm",
  siteAddress: "Đường mẫu, Đà Nẵng",
  salesRepName: "NV Kinh doanh",
  contactPhone: "0900000000",
  requestedAt: new Date("2026-10-31T01:45:00.000Z"),
  plannedStartAt: new Date("2026-10-31T02:15:00.000Z"),
  plannedEndAt: new Date("2026-10-31T03:15:00.000Z"),
  quantityM3: "25.5",
  actualM3: "10.5",
  grade: "250 (12+2)",
  sandType: "Cát vàng",
  stoneType: "Đá 1x2",
  pumpRequired: "Bơm 50m",
  pumpOperator: "NV bơm",
  assignedVehicle: "Bơm cần 42m",
  truckCapacityM3: "7",
  pourType: "Sàn",
  salesNote: "Gọi trước khi tới",
  planningNote: "Đổi đường vào",
  status: "SCHEDULED",
};

test("plan workbook contains Vietnamese plan columns, scheduled order and summary formulas", async () => {
  const from = new Date("2026-10-31T00:00:00+07:00");
  const workbook = createPlanWorkbook("2026-10-31", from, [exampleOrder]);
  const buffer = await workbook.xlsx.writeBuffer();
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(buffer);

  const sheet = reopened.getWorksheet("Kế hoạch cấp");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A6").value, "STT");
  assert.equal(sheet.getCell("D6").value, "Mã đơn");
  assert.equal(sheet.getCell("O6").value, "Phương tiện");
  assert.equal(sheet.getCell("D7").value, "BOOK-7431");
  assert.equal(sheet.getCell("B7").value, "09:15");
  assert.equal(sheet.getCell("C7").value, "10:15");
  assert.equal(sheet.getCell("I7").value, 25.5);
  assert.equal(sheet.getCell("L7").value, "Cát vàng");
  assert.equal(sheet.getCell("O7").value, "Bơm cần 42m");
  assert.equal(sheet.getCell("R7").value, "Gọi trước khi tới");
  assert.equal(sheet.getCell("S7").value, "Đổi đường vào");
  assert.equal(sheet.getCell("T7").value, "Bơm 50m");
  assert.match(String(sheet.getCell("U7").value), /08:45/);
  assert.equal(sheet.getCell("V7").value, "Đã xếp lịch");
  assert.deepEqual(sheet.getCell("I8").value, { formula: "SUM(I7:I7)", result: 25.5 });
  assert.equal(sheet.getCell("J8").value && typeof sheet.getCell("J8").value, "object");
  assert.equal(sheet.pageSetup.orientation, "landscape");
  assert.equal(sheet.pageSetup.paperSize, 8);
  assert.equal(sheet.views[0]?.state, "frozen");
  assert.ok(sheet.autoFilter);
});

test("an empty plan has numeric zero totals without circular formulas", async () => {
  const workbook = createPlanWorkbook("2026-10-31", new Date("2026-10-31T00:00:00+07:00"), []);
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(await workbook.xlsx.writeBuffer());
  assert.equal(reopened.getWorksheet("Kế hoạch cấp")?.getCell("I7").value, 0);
  assert.equal(reopened.getWorksheet("Kế hoạch cấp")?.getCell("J7").value, 0);
});
