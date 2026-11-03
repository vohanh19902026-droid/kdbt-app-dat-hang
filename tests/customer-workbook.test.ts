import assert from "node:assert/strict";
import test from "node:test";
import { createCustomerImportTemplate, createCustomerExportWorkbook, normalizeCustomerDuplicateKey, parseCustomerWorkbook } from "../src/lib/customer-workbook";

test("Vietnamese import template is an XLSX form with formatted headers", async () => {
  const workbook = createCustomerImportTemplate();
  const sheet = workbook.getWorksheet("Danh sách khách hàng");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A1").value, "DANH SÁCH KHÁCH HÀNG – CENCOM");
  assert.equal(sheet.getCell("A4").value, "Tên khách hàng");
  assert.equal((sheet.views[0] as { ySplit?: number } | undefined)?.ySplit, 4);
  assert.equal(workbook.xlsx.writeBuffer() instanceof Promise, true);
});

test("parses customer rows from the formatted XLSX template and preserves worksheet row numbers", async () => {
  const workbook = createCustomerImportTemplate();
  const sheet = workbook.getWorksheet("Danh sách khách hàng")!;
  sheet.getRow(5).values = ["Công ty An Phát, Chi nhánh 2", "0900", "Đường số 1, phường A", "kd@example.com", "KD01"];
  const bytes = await workbook.xlsx.writeBuffer();
  const result = await parseCustomerWorkbook(Buffer.from(bytes));
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.rows, [{ rowNumber: 5, name: "Công ty An Phát, Chi nhánh 2", phone: "0900",
    defaultAddress: "Đường số 1, phường A", salesRepEmail: "kd@example.com", employeeCode: "KD01" }]);
});

test("reports invalid assignments and enforces the 200 row limit", async () => {
  const workbook = createCustomerImportTemplate();
  const sheet = workbook.getWorksheet("Danh sách khách hàng")!;
  sheet.getRow(5).values = ["Khách không có NVKD", "", "", "", ""];
  const result = await parseCustomerWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));
  assert.match(result.errors[0].message, /Thiếu Email NVKD hoặc Mã NVKD/);

  sheet.spliceRows(5, 1);
  for (let index = 0; index < 201; index++) sheet.addRow([`Khách ${index}`, "", "", "kd@example.com", ""]);
  const oversized = await parseCustomerWorkbook(Buffer.from(await workbook.xlsx.writeBuffer()));
  assert.match(oversized.errors[0].message, /tối đa 200/);
});

test("customer export is a formatted Vietnamese workbook", () => {
  const workbook = createCustomerExportWorkbook([{ name: "Khách A", phone: "0900", defaultAddress: "Địa chỉ A",
    salesRepName: "NVKD A", employeeCode: "KD01", isActive: true, createdAt: new Date("2026-01-01T00:00:00Z") }]);
  const sheet = workbook.getWorksheet("Khách hàng");
  assert.ok(sheet);
  assert.equal(sheet.getCell("A4").value, "STT");
  assert.equal(sheet.getCell("B4").value, "Tên khách hàng");
  assert.equal(sheet.getCell("B5").value, "Khách A");
  assert.ok(sheet.autoFilter);
});

test("duplicate keys ignore telephone formatting and address whitespace", () => {
  assert.equal(normalizeCustomerDuplicateKey({ name: "  Công Ty A  ", phone: "0900 111 222", defaultAddress: "Đường   A" }),
    normalizeCustomerDuplicateKey({ name: "công ty a", phone: "0900-111-222", defaultAddress: "Đường A" }));
});
