import { requireSession } from "@/lib/session";
import { AccountingLedger } from "@/components/accounting-ledger";
import { defaultAccountingRange, getAccountingData } from "@/lib/accounting-data";

export const runtime = "nodejs";

export default async function AccountingPage() {
  const session = await requireSession(["ADMIN", "ACCOUNTANT", "SALES"]);
  const range = defaultAccountingRange();
  const ownerSalesRepId = session.appRole === "SALES" ? session.user.id : undefined;
  const initialData = await getAccountingData(range.from, range.to, ownerSalesRepId ?? null, { ownerSalesRepId });
  return <AccountingLedger initialData={initialData} role={session.appRole} />;
}
