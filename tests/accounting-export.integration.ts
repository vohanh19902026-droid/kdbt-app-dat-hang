import assert from "node:assert/strict";
import { test } from "node:test";
import { db } from "../src/db";
import { getAccountingData } from "../src/lib/accounting-data";
import { createAccountingWorkbook } from "../src/lib/accounting-workbook";

// Run only against a freshly created, disposable local database.
test("accounting export includes every matching entry beyond the screen limit", async () => {
  const target = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(target.hostname));
  assert.match(target.pathname, /^\/cencom_export_verify_[a-z0-9_]+$/);
  const pool = db.$client;
  try {
    const existing = await pool.query('SELECT count(*)::int AS count FROM "user"');
    assert.equal(existing.rows[0].count, 0, "Test database must be empty");
    await pool.query(`INSERT INTO "user" (id, name, email, app_role) VALUES ('test-rep', 'Test sales', 'test@example.invalid', 'SALES')`);
    await pool.query(`INSERT INTO "user" (id, name, email, app_role) VALUES ('other-rep', 'Other sales', 'other@example.invalid', 'SALES')`);
    const customer = await pool.query(`INSERT INTO customers (name, sales_rep_id) VALUES ('Test customer', 'test-rep') RETURNING id`);
    const otherCustomer = await pool.query(`INSERT INTO customers (name, sales_rep_id) VALUES ('Other customer', 'other-rep') RETURNING id`);
    await pool.query(`INSERT INTO receivable_entries (customer_id, entry_type, amount_vnd, occurred_at, created_by)
      SELECT $1, 'CHARGE', 1000, '2026-11-02T12:00:00+07:00', 'test-rep' FROM generate_series(1, 1001)`, [customer.rows[0].id]);
    await pool.query(`INSERT INTO receivable_entries (customer_id, entry_type, amount_vnd, occurred_at, created_by)
      VALUES ($1, 'CHARGE', 9000000, '2026-11-02T12:00:00+07:00', 'other-rep')`, [otherCustomer.rows[0].id]);

    const screen = await getAccountingData("2026-11-02", "2026-11-02", "test-rep");
    const exported = await getAccountingData("2026-11-02", "2026-11-02", "test-rep", { exportAllEntries: true });
    assert.equal(screen.entries.length, 1000);
    assert.equal(screen.maxEntriesReached, true);
    assert.equal(exported.entries.length, 1001);
    assert.equal(exported.maxEntriesReached, false);
    assert.equal(exported.periodTotals.chargesVnd, "1001000");
    const salesView = await getAccountingData("2026-11-02", "2026-11-02", null, { exportAllEntries: true, ownerSalesRepId: "test-rep" });
    assert.deepEqual(salesView.customers.map((row) => row.name), ["Test customer"]);
    assert.deepEqual(salesView.salesReps.map((row) => row.id), ["test-rep"]);
    assert.deepEqual([...new Set(salesView.entries.map((row) => row.customerName))], ["Test customer"]);
    assert.equal(salesView.periodTotals.chargesVnd, "1001000");
    const sheet = createAccountingWorkbook(exported).worksheets[0];
    const detailRows = sheet.getSheetValues().filter((row) => Array.isArray(row) && row[2] === "Test customer" && row[5] === "Phải thu");
    assert.equal(detailRows.length, 1001);
  } finally {
    await pool.end();
  }
});
