import { requireSession } from "@/lib/session";
import { AccountingLedger } from "@/components/accounting-ledger";
import { defaultAccountingRange, getAccountingData } from "@/lib/accounting-data";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getAppSettings } from "@/lib/app-settings";

export const runtime = "nodejs";

export default async function AccountingPage() {
  const session = await requireSession(["ADMIN", "ACCOUNTANT", "SALES"]);
  const range = defaultAccountingRange();
  const ownerSalesRepId = session.appRole === "SALES" ? session.user.id : undefined;
  const [initialData, orderRows, settings] = await Promise.all([
    getAccountingData(range.from, range.to, ownerSalesRepId ?? null, { ownerSalesRepId }),
    session.appRole === "ADMIN" || session.appRole === "ACCOUNTANT"
      ? db.select({ id: orders.id, bookingNo: orders.bookingNo, customerName: orders.customerName, pourType: orders.pourType, requestedAt: orders.requestedAt, version: orders.version }).from(orders).orderBy(desc(orders.requestedAt)).limit(500)
      : Promise.resolve([]),
    getAppSettings(),
  ]);
  return <AccountingLedger initialData={initialData} role={session.appRole} orderComponents={orderRows.map((row) => ({ ...row, version: Number(row.version) }))} componentTypes={settings.catalog.pourTypes} />;
}
