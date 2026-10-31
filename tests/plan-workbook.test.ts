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
  plannedStartAt: new Date("2026-10-31T02:15:00.000Z"),
  plannedEndAt: new Date("2026-10-31T03:15:00.000Z"),
  quantityM3: "25.5",
  actualM3: "10.5",
  grade: "250 (12+2)",
  sandType: "Cát vàng",
  stoneType: "Đá 1x2",
  pumpOperator: "NV bơm",
  assignedVehicle: "Bơm cần 42m",
  truckCapacityM3: "7",
  pourType: "Sàn",
  salesNote: "Gọi trước khi tới",
  planningNote: null,
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
  assert.deepEqual(sheet.getCell("I8").value, { formula: "SUM(I7:I7)", result: 25.5 });
  assert.equal(sheet.getCell("J8").value && typeof sheet.getCell("J8").value, "object");
  assert.equal(sheet.pageSetup.orientation, "landscape");
  assert.equal(sheet.pageSetup.paperSize, 8);
  assert.equal(sheet.views[0]?.state, "frozen");
  assert.ok(sheet.autoFilter);
});
