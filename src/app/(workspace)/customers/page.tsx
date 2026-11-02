import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { customers, user } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { CustomersManager } from "@/components/customers-manager";

export const runtime = "nodejs";

export default async function CustomersPage() {
  const { appRole } = await requireSession(["ADMIN", "PLANNER"]);
  const [rows, salesUsers] = await Promise.all([
    db.select({ id: customers.id, name: customers.name, phone: customers.phone,
      defaultAddress: customers.defaultAddress, salesRepId: customers.salesRepId,
      salesRepName: user.name, isActive: customers.isActive, createdAt: customers.createdAt })
      .from(customers).leftJoin(user, eq(customers.salesRepId, user.id))
      .orderBy(asc(customers.name), asc(customers.id)),
    appRole === "ADMIN"
      ? db.select({ id: user.id, name: user.name, email: user.email, employeeCode: user.employeeCode, isActive: user.isActive }).from(user)
        .where(eq(user.appRole, "SALES")).orderBy(asc(user.name))
      : Promise.resolve([]),
  ]);
  return <CustomersManager customers={rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }))}
    salesUsers={salesUsers} canManage={appRole === "ADMIN"} />;
}
