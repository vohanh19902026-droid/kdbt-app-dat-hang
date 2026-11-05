import { requireSession } from "@/lib/session";
import { LegacyRosterManager } from "@/components/legacy-roster-manager";

export const runtime = "nodejs";

export default async function LegacyRosterPage() {
  await requireSession(["ADMIN"]);
  return <LegacyRosterManager />;
}
