import assert from "node:assert/strict";
import { test } from "node:test";
import { db } from "../src/db";
import { resolveBookingCustomer } from "../src/lib/booking-customer";

test("bookings distinguish same-name customers and enforce the sales owner", async () => {
  const target = new URL(process.env.DATABASE_URL ?? "");
  assert.ok(["127.0.0.1", "localhost", "::1"].includes(target.hostname));
  assert.match(target.pathname, /^\/cencom_booking_verify_[a-z0-9_]+$/);
  const pool = db.$client;
  try {
    const existing = await pool.query("SELECT count(*)::int AS count FROM customers");
    assert.equal(existing.rows[0].count, 0, "Test database must contain no customers");
    await pool.query(`INSERT INTO "user" (id, name, email, app_role) VALUES
      ('rep-a', 'Rep A', 'rep-a@example.invalid', 'SALES'),
      ('rep-b', 'Rep B', 'rep-b@example.invalid', 'SALES')`);
    const input = { customerName: "Anh Nam", contactPhone: "", siteAddress: "Địa chỉ thử" };
    const first = await db.transaction((tx) => resolveBookingCustomer(tx, input, { id: "rep-a", role: "SALES" }));
    const second = await db.transaction((tx) => resolveBookingCustomer(tx, input, { id: "rep-a", role: "SALES" }));
    assert.notEqual(first.id, second.id, "Same name alone must not merge customers");
    const reused = await db.transaction((tx) => resolveBookingCustomer(tx, { ...input, customerId: first.id, customerName: "Tên giả" }, { id: "rep-a", role: "SALES" }));
    assert.deepEqual(reused, first, "A selected customer retains its official name");
    await assert.rejects(db.transaction((tx) => resolveBookingCustomer(tx, { ...input, customerId: first.id }, { id: "rep-b", role: "SALES" })), /INVALID_CUSTOMER/);
    assert.deepEqual(await db.transaction((tx) => resolveBookingCustomer(tx, { ...input, customerId: first.id }, { id: "admin", role: "ADMIN" })), first);
    const unassigned = await db.transaction((tx) => resolveBookingCustomer(tx, input, { id: "admin", role: "ADMIN" }));
    await db.transaction((tx) => resolveBookingCustomer(tx, { ...input, customerId: unassigned.id }, { id: "rep-b", role: "SALES" }));
    const owner = await pool.query("SELECT sales_rep_id FROM customers WHERE id = $1", [unassigned.id]);
    assert.equal(owner.rows[0].sales_rep_id, "rep-b");
  } finally {
    await pool.end();
  }
});
