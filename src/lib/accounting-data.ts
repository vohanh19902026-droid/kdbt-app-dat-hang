import { aliasedTable, and, asc, desc, eq, gte, isNotNull, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { customers, orders, receivableEntries, user } from "@/db/schema";
import { clampIsoDateRange, isValidIsoDate, todayVN, vnDateRange } from "@/lib/vn-date";
import { summarizeReceivableEntries } from "@/lib/receivables";

export const ACCOUNTING_MAX_RANGE_DAYS = 92;
export const ACCOUNTING_EXPORT_MAX_ENTRIES = 100_000;
const zero = "0";
export const UNASSIGNED_SALES_REP = "unassigned";
const chargeSum = sql<string>`COALESCE(SUM(CASE WHEN ${receivableEntries.entryType} = 'CHARGE' THEN ${receivableEntries.amountVnd} ELSE 0 END), 0)::text`;
const paymentSum = sql<string>`COALESCE(SUM(CASE WHEN ${receivableEntries.entryType} = 'PAYMENT' THEN ${receivableEntries.amountVnd} ELSE 0 END), 0)::text`;

export function defaultAccountingRange() {
  const today = todayVN();
  return { from: `${today.slice(0, 7)}-01`, to: today };
}

export async function getAccountingData(rawFrom: string, rawTo: string, salesRepId: string | null = null, options: { exportAllEntries?: boolean } = {}) {
  if (!isValidIsoDate(rawFrom) || !isValidIsoDate(rawTo)) throw new RangeError("INVALID_ACCOUNTING_RANGE");
  const range = clampIsoDateRange(rawFrom, rawTo, ACCOUNTING_MAX_RANGE_DAYS);
  const from = vnDateRange(range.from).from;
  const to = vnDateRange(range.to).to;

  const salesRepCondition = salesRepId === UNASSIGNED_SALES_REP
    ? isNull(customers.salesRepId)
    : salesRepId ? eq(customers.salesRepId, salesRepId) : undefined;
  const [periodTotals] = await db.select({ chargesVnd: chargeSum, paymentsVnd: paymentSum })
    .from(receivableEntries).innerJoin(customers, eq(receivableEntries.customerId, customers.id))
    .where(and(gte(receivableEntries.occurredAt, from), lt(receivableEntries.occurredAt, to), salesRepCondition));

  const salesRepUser = aliasedTable(user, "customer_sales_rep");
  const balances = await db.select({
    customerId: customers.id,
    customerName: customers.name,
    salesRepId: customers.salesRepId,
    salesRepName: salesRepUser.name,
    chargesVnd: chargeSum,
    paymentsVnd: paymentSum,
  }).from(receivableEntries)
    .innerJoin(customers, eq(receivableEntries.customerId, customers.id))
    .leftJoin(salesRepUser, eq(customers.salesRepId, salesRepUser.id))
    .where(salesRepCondition)
    .groupBy(customers.id, customers.name, customers.salesRepId, salesRepUser.name)
    .orderBy(asc(customers.name));

  const entryCreator = aliasedTable(user, "entry_creator");
  const entries = await db.select({
    id: receivableEntries.id,
    customerId: receivableEntries.customerId,
    customerName: customers.name,
    salesRepId: customers.salesRepId,
    salesRepName: salesRepUser.name,
    orderId: receivableEntries.orderId,
    bookingNo: orders.bookingNo,
    entryType: receivableEntries.entryType,
    amountVnd: receivableEntries.amountVnd,
    referenceNo: receivableEntries.referenceNo,
    occurredAt: receivableEntries.occurredAt,
    note: receivableEntries.note,
    createdAt: receivableEntries.createdAt,
    createdByName: entryCreator.name,
  }).from(receivableEntries)
    .innerJoin(customers, eq(receivableEntries.customerId, customers.id))
    .leftJoin(orders, eq(receivableEntries.orderId, orders.id))
    .leftJoin(entryCreator, eq(receivableEntries.createdBy, entryCreator.id))
    .leftJoin(salesRepUser, eq(customers.salesRepId, salesRepUser.id))
    .where(and(gte(receivableEntries.occurredAt, from), lt(receivableEntries.occurredAt, to), salesRepCondition))
    .orderBy(desc(receivableEntries.occurredAt), desc(receivableEntries.createdAt), desc(receivableEntries.id))
    .limit(options.exportAllEntries ? ACCOUNTING_EXPORT_MAX_ENTRIES + 1 : 1001);

  if (options.exportAllEntries && entries.length > ACCOUNTING_EXPORT_MAX_ENTRIES) {
    throw new RangeError("ACCOUNTING_EXPORT_TOO_LARGE");
  }

  const activeCustomers = await db.select({ id: customers.id, name: customers.name })
    .from(customers).where(eq(customers.isActive, true)).orderBy(asc(customers.name)).limit(1000);
  const salesReps = await db.select({ id: user.id, name: user.name, isActive: user.isActive })
    .from(user).where(eq(user.appRole, "SALES")).orderBy(asc(user.name));
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
  const maxEntriesReached = !options.exportAllEntries && entries.length > 1000;

  return {
    period: { from: range.from, to: range.to, clamped: range.clamped, maxDays: ACCOUNTING_MAX_RANGE_DAYS },
    periodTotals: { chargesVnd: periodTotals?.chargesVnd ?? zero, paymentsVnd: periodTotals?.paymentsVnd ?? zero },
    allTimeBalanceVnd: totalBalance.toString(),
    balances: balancesWithBalance,
    customers: activeCustomers,
    salesReps,
    salesRepFilter: salesRepId,
    salesRepFilterLabel: salesRepId === UNASSIGNED_SALES_REP
      ? "Chưa phân công"
      : salesReps.find((rep) => rep.id === salesRepId)?.name ?? "Tất cả nhân viên",
    recentOrders,
    entries: (options.exportAllEntries ? entries : entries.slice(0, 1000)).map((row) => ({ ...row, occurredAt: row.occurredAt.toISOString(), createdAt: row.createdAt.toISOString() })),
    maxEntriesReached,
  };
}
