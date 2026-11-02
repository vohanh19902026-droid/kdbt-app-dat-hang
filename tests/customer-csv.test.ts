import assert from "node:assert/strict";
import test from "node:test";
import { normalizeCustomerDuplicateKey, parseCustomerCsv } from "../src/lib/customer-csv";

test("parses UTF-8 Vietnamese CSV, quoted commas, and employee assignment", () => {
  const result = parseCustomerCsv("\uFEFFTên khách hàng,Số điện thoại,Địa chỉ mặc định,Email NVKD,Mã NVKD\r\n\"Công ty An Phát, Chi nhánh 2\",0900,\"Đường số 1, phường A\",kd@example.com,KD01\r\n");
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows.length, 1);
  assert.deepEqual(result.rows[0], {
    rowNumber: 2, name: "Công ty An Phát, Chi nhánh 2", phone: "0900",
    defaultAddress: "Đường số 1, phường A", salesRepEmail: "kd@example.com", employeeCode: "KD01",
  });
});

test("accepts Excel semicolon CSV and quoted newlines", () => {
  const result = parseCustomerCsv("Tên khách hàng;Địa chỉ mặc định;Mã NVKD\n\"Nhà dân A\";\"Ngõ 1;\nphường B\";KD02\n");
  assert.deepEqual(result.errors, []);
  assert.equal(result.rows[0]?.defaultAddress, "Ngõ 1;\nphường B");
});

test("requires valid ownership and reports row-level data errors", () => {
  const result = parseCustomerCsv("Tên khách hàng,Email NVKD\nKhách A,khong-phai-email\nKhách B,\n");
  assert.equal(result.rows.length, 0);
  assert.equal(result.errors.length, 2);
  assert.match(result.errors[0].message, /Email NVKD không hợp lệ/);
  assert.match(result.errors[1].message, /Email NVKD hoặc Mã NVKD phụ trách/);
});

test("requires a sales assignment column and enforces the import limit", () => {
  assert.match(parseCustomerCsv("Tên khách hàng,Số điện thoại\nKhách A,0900").errors[0].message, /Email NVKD hoặc Mã NVKD/);
  const rows = ["Tên khách hàng,Email NVKD", ...Array.from({ length: 201 }, (_, index) => `Khách ${index},kd@example.com`)].join("\n");
  assert.match(parseCustomerCsv(rows).errors[0].message, /tối đa 200/);
});

test("rejects malformed quoted CSV instead of merging rows silently", () => {
  const result = parseCustomerCsv("Tên khách hàng,Email NVKD\n\"Khách chưa đóng,kd@example.com\n");
  assert.equal(result.rows.length, 0);
  assert.match(result.errors[0].message, /ngoặc kép chưa đóng/);
});

test("duplicate keys ignore telephone formatting and address whitespace", () => {
  assert.equal(normalizeCustomerDuplicateKey({ name: "  Công Ty A  ", phone: "0900 111 222", defaultAddress: "Đường   A" }),
    normalizeCustomerDuplicateKey({ name: "công ty a", phone: "0900-111-222", defaultAddress: "Đường A" }));
});
