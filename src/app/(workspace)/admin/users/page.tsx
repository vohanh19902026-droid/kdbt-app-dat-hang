import { asc } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { UsersManager } from "@/components/users-manager";

export const runtime="nodejs";
export default async function UsersPage(){
  await requireSession(["ADMIN"]);const rows=await db.select({id:user.id,name:user.name,email:user.email,appRole:user.appRole,isActive:user.isActive,createdAt:user.createdAt,employeeCode:user.employeeCode,phone:user.phone,department:user.department,monthlyTargetM3:user.monthlyTargetM3}).from(user).orderBy(asc(user.name));
  return <UsersManager users={rows.map(u=>({...u,createdAt:u.createdAt.toISOString()}))}/>;
}
