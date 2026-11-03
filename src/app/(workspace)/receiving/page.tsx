import { redirect } from "next/navigation";
import { normalizeIsoDate } from "@/lib/vn-date";

export default async function ReceivingPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { date } = await searchParams;
  redirect(`/orders?view=receiving&date=${encodeURIComponent(normalizeIsoDate(date))}`);
}
