import { and, asc, desc, eq, gte, isNotNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, receivableEntries, user } from "@/db/schema";
import { clampIsoDateRange, isValidIsoDate, todayVN, vnDateRange } from "@/lib/vn-date";
import { summarizeReceivableEntries } from "@/lib/receivables";

export const ACCOUNTING_MAX_RANGE_DAYS = 92;
const zero = "0";
const chargeSum = sql<string>`COALESCE(SUM(CASE WHEN ${receivableEntries.entryType} = 'CHARGE' THEN ${receivableEntries.amountVnd} ELSE 0 END), 0)::text`;
const paymentSum = sql<string>`COALESCE(SUM(CASE WHEN ${receivableEntries.entryType} = 'PAYMENT' THEN ${receivableEntries.amountVnd} ELSE 0 END), 0)::text`;

export function defaultAccountingRange() {
  const today = todayVN();
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

export async function getAccountingData(rawFrom: string, rawTo: string) {
  if (!isValidIsoDate(rawFrom) || !isValidIsoDate(rawTo)) throw new RangeError("INVALID_ACCOUNTING_RANGE");
  const range = clampIsoDateRange(rawFrom, rawTo, ACCOUNTING_MAX_RANGE_DAYS);
  const from = vnDateRange(range.from).from;
  const to = vnDateRange(range.to).to;

  const [periodTotals] = await db.select({ chargesVnd: chargeSum, paymentsVnd: paymentSum })
    .from(receivableEntries).where(and(gte(receivableEntries.occurredAt, from), lt(receivableEntries.occurredAt, to)));

  const balances = await db.select({
    customerId: customers.id,
    customerName: customers.name,
    chargesVnd: chargeSum,
    paymentsVnd: paymentSum,
  }).from(receivableEntries)
    .innerJoin(customers, eq(receivableEntries.customerId, customers.id))
    .groupBy(customers.id, customers.name)
    .orderBy(asc(customers.name));

  const entries = await db.select({
    id: receivableEntries.id,
    customerId: receivableEntries.customerId,
    customerName: customers.name,
    orderId: receivableEntries.orderId,
    bookingNo: orders.bookingNo,
    entryType: receivableEntries.entryType,
    amountVnd: receivableEntries.amountVnd,
    referenceNo: receivableEntries.referenceNo,
    occurredAt: receivableEntries.occurredAt,
    note: receivableEntries.note,
    createdAt: receivableEntries.createdAt,
    createdByName: user.name,
  }).from(receivableEntries)
    .innerJoin(customers, eq(receivableEntries.customerId, customers.id))
    .leftJoin(orders, eq(receivableEntries.orderId, orders.id))
    .leftJoin(user, eq(receivableEntries.createdBy, user.id))
    .where(and(gte(receivableEntries.occurredAt, from), lt(receivableEntries.occurredAt, to)))
    .orderBy(desc(receivableEntries.occurredAt), desc(receivableEntries.createdAt))
    .limit(1001);

  const activeCustomers = await db.select({ id: customers.id, name: customers.name })
    .from(customers).where(eq(customers.isActive, true)).orderBy(asc(customers.name)).limit(1000);
  const recentOrders = await db.select({
    id: orders.id,
    customerId: orders.customerId,
    bookingNo: orders.bookingNo,
    customerName: orders.customerName,
  }).from(orders)
    .where(and(isNotNull(orders.customerId), ne(orders.status, "CANCELLED")))
    .orderBy(desc(orders.createdAt)).limit(500);

  const balancesWithBalance = balances.map((row) => ({
    ...row,
    ...summarizeReceivableEntries([
      { entryType: "CHARGE" as const, amountVnd: row.chargesVnd ?? zero },
      { entryType: "PAYMENT" as const, amountVnd: row.paymentsVnd ?? zero },
    ]),
  }));
  const totalBalance = balancesWithBalance.reduce((sum, row) => sum + BigInt(row.balanceVnd), 0n);
  const maxEntriesReached = entries.length > 1000;

  return {
    period: { from: range.from, to: range.to, clamped: range.clamped, maxDays: ACCOUNTING_MAX_RANGE_DAYS },
    periodTotals: { chargesVnd: periodTotals?.chargesVnd ?? zero, paymentsVnd: periodTotals?.paymentsVnd ?? zero },
    allTimeBalanceVnd: totalBalance.toString(),
    balances: balancesWithBalance,
    customers: activeCustomers,
    recentOrders,
    entries: entries.slice(0, 1000).map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString(), createdAt: row.createdAt.toISOString() })),
    maxEntriesReached,
  };
}
