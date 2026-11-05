import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if ((session.user as typeof session.user & { isActive?: boolean }).isActive === false) redirect("/pending-approval");
  redirect("/orders");
}
