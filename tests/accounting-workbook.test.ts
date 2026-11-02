import assert from "node:assert/strict";
import test from "node:test";
import ExcelJS from "exceljs";
import { createAccountingWorkbook, type AccountingWorkbookData } from "../src/lib/accounting-workbook";

const fixture: AccountingWorkbookData = {
  period: { from: "2026-11-01", to: "2026-11-02" },
  salesRepFilterLabel: "UAT Kinh doanh",
  periodTotals: { chargesVnd: "25000000", paymentsVnd: "10000000" },
  allTimeBalanceVnd: "15000000",
  balances: [{ customerName: "UAT Công trình Tân Phú", salesRepName: "UAT Kinh doanh", chargesVnd: "25000000", paymentsVnd: "10000000", balanceVnd: "15000000" }],
  entries: [{
    occurredAt: "2026-11-02T05:00:00.000Z", customerName: "UAT Công trình Tân Phú", salesRepName: "UAT Kinh doanh", bookingNo: "BOOK-7445",
    entryType: "CHARGE", amountVnd: "25000000", referenceNo: "UAT-HD-001", note: "Ghi nhận sản lượng UAT", createdByName: "UAT Kế toán",
  }],
  maxEntriesReached: false,
};

test("accounting workbook opens with summary, balances, and detail rows", async () => {
  const source = createAccountingWorkbook(fixture);
  const bytes = await source.xlsx.writeBuffer();
  const reopened = new ExcelJS.Workbook();
  await reopened.xlsx.load(bytes as unknown as ArrayBuffer);

  const sheet = reopened.getWorksheet("Sổ công nợ");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A1").text, "SỔ THEO DÕI CÔNG NỢ KHÁCH HÀNG");
  assert.equal(sheet.getCell("B5").value, 25_000_000);
  assert.equal(sheet.getCell("B6").value, 10_000_000);
  const values = JSON.stringify(sheet.getSheetValues());
  assert.match(values, /UAT Công trình Tân Phú/);
  assert.match(values, /BOOK-7445/);
  assert.match(values, /UAT-HD-001/);
  assert.match(values, /UAT Kinh doanh/);
});
