import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ColdKeyRecovery } from "@/components/cold-key-recovery";

export default async function ColdKeyRecoveryPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const initialEnvironment = process.env.VERCEL_ENV === "production" ? "production" : "preview";
  return <ColdKeyRecovery email={session.user.email} initialEnvironment={initialEnvironment} />;
}
