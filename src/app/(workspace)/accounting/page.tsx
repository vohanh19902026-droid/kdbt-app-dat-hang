import { requireSession } from "@/lib/session";
import { AccountingLedger } from "@/components/accounting-ledger";
import { defaultAccountingRange, getAccountingData } from "@/lib/accounting-data";

export const runtime = "nodejs";

export default async function AccountingPage() {
  await requireSession(["ADMIN", "ACCOUNTANT"]);
  const range = defaultAccountingRange();
  const initialData = await getAccountingData(range.from, range.to);
  return <AccountingLedger initialData={initialData} />;
}
