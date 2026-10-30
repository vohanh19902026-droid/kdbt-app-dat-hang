import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { AppRole } from "@/lib/types";
import {db} from "@/db";
import {user} from "@/db/schema";
import {eq} from "drizzle-orm";

export async function getSession() {
  const current = await auth.api.getSession({ headers: await headers() });
  if (!current || (current.user as typeof current.user & { isActive?: boolean }).isActive === false) return null;
  return current;
}

export async function getApiSession(requestHeaders:Headers) {
  const current=await auth.api.getSession({headers:requestHeaders});
  if(!current)return null;
  const [record]=await db.select({appRole:user.appRole,isActive:user.isActive}).from(user).where(eq(user.id,current.user.id)).limit(1);
  if(!record||!record.isActive)return null;
  return {...current,appRole:record.appRole};
}

export async function requireSession(roles?: AppRole[]) {
  const session = await getSession();
  if (!session) redirect("/login");
  const role = (session.user as typeof session.user & { appRole?: AppRole }).appRole ?? "SALES";
  if (roles && !roles.includes(role)) redirect("/orders?denied=1");
  return { ...session, appRole: role };
}

export function appRoleOf(user: { appRole?: string }): AppRole {
  return (user.appRole as AppRole) || "SALES";
}
