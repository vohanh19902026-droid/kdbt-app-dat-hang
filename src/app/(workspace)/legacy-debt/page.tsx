import { requireSession } from "@/lib/session";
import { LegacyDebtLookup } from "@/components/legacy-debt-lookup";

export const runtime = "nodejs";

export default async function LegacyDebtPage() {
  const { appRole } = await requireSession(["ADMIN", "ACCOUNTANT", "SALES"]);
  const role = appRole as "ADMIN" | "ACCOUNTANT" | "SALES";
  return <LegacyDebtLookup role={role} />;
}
