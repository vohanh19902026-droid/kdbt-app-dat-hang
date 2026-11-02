import assert from "node:assert/strict";
import test from "node:test";
import { canManageReceivables, canRecordReceivableEntry, canViewReceivables, formatVnd, receivableEntrySchema, summarizeReceivableEntries } from "../src/lib/receivables";

test("receivable ledger adds charges and subtracts payments exactly in VND", () => {
  assert.deepEqual(summarizeReceivableEntries([
    { entryType: "CHARGE", amountVnd: "150000000" },
    { entryType: "PAYMENT", amountVnd: "40000000" },
    { entryType: "CHARGE", amountVnd: "27500000" },
  ]), {
    chargesVnd: "177500000",
    paymentsVnd: "40000000",
    balanceVnd: "137500000",
  });
});

test("receivable ledger preserves balances above JavaScript's safe integer range", () => {
  assert.equal(summarizeReceivableEntries([
    { entryType: "CHARGE", amountVnd: "9007199254740000" },
    { entryType: "PAYMENT", amountVnd: "1" },
  ]).balanceVnd, "9007199254739999");
});

test("payments may create a customer credit balance without rounding", () => {
  assert.equal(summarizeReceivableEntries([
    { entryType: "PAYMENT", amountVnd: "8000" },
    { entryType: "CHARGE", amountVnd: "5000" },
  ]).balanceVnd, "-3000");
  assert.match(formatVnd("9007199254740000"), /9\.007\.199\.254\.740\.000/);
});

test("sales can view receivables but only Admin and Accountant can manage the ledger", () => {
  assert.equal(canViewReceivables("ADMIN"), true);
  assert.equal(canViewReceivables("ACCOUNTANT"), true);
  assert.equal(canViewReceivables("SALES"), true);
  assert.equal(canViewReceivables("PLANNER"), false);
  assert.equal(canManageReceivables("ADMIN"), true);
  assert.equal(canManageReceivables("ACCOUNTANT"), true);
  assert.equal(canManageReceivables("SALES"), false);
  assert.equal(canManageReceivables("PLANNER"), false);
  assert.equal(canRecordReceivableEntry("SALES", "PAYMENT"), true);
  assert.equal(canRecordReceivableEntry("SALES", "CHARGE"), false);
  assert.equal(canRecordReceivableEntry("ADMIN", "CHARGE"), true);
  assert.equal(canRecordReceivableEntry("ACCOUNTANT", "PAYMENT"), true);
  assert.equal(canRecordReceivableEntry("PLANNER", "PAYMENT"), false);
});

test("ledger input rejects fractional, non-positive, excessive and impossible dates", () => {
  const good = { customerId: "81fb93ca-9e32-4b5c-80f8-a6e4044a0f69", entryType: "CHARGE", amountVnd: 2000, occurredOn: "2026-11-02" };
  assert.equal(receivableEntrySchema.safeParse(good).success, true);
  assert.equal(receivableEntrySchema.safeParse({ ...good, amountVnd: 1.5 }).success, false);
  assert.equal(receivableEntrySchema.safeParse({ ...good, amountVnd: 0 }).success, false);
  assert.equal(receivableEntrySchema.safeParse({ ...good, amountVnd: 1_000_000_000_000_000 }).success, false);
  assert.equal(receivableEntrySchema.safeParse({ ...good, occurredOn: "2026-02-30" }).success, false);
});
