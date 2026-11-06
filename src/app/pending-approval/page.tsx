import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getSession } from "@/lib/session";
import { PendingRegistration } from "@/components/pending-registration";
import type { AppRole } from "@/lib/types";
import { PLATFORM_OWNER_EMAIL } from "@/lib/platform-owner-bootstrap-policy";

export const runtime = "nodejs";

export default async function PendingApprovalPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const [account] = await db.select({ name: user.name, email: user.email, isActive: user.isActive, isPlatformOwner: user.isPlatformOwner, requestedRole: user.requestedAppRole })
    .from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!account) redirect("/login");
  if (account.isPlatformOwner) redirect("/orders");
  const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.isPlatformOwner, true)).limit(1);
  const canBootstrapOwner = process.env.VERCEL_ENV === "preview" &&
    session.user.email.trim().toLowerCase() === PLATFORM_OWNER_EMAIL &&
    session.user.emailVerified && !owner;
  if (account.isActive && !canBootstrapOwner) redirect("/orders");
  return <PendingRegistration name={account.name} email={account.email} requestedRole={account.requestedRole as AppRole | null} canBootstrapOwner={canBootstrapOwner} />;
}
