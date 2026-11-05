import { and, asc, gte, lt, ne, sql } from "drizzle-orm";
import { AdminSettings } from "@/components/admin-settings";
import { db } from "@/db";
import { orders, user } from "@/db/schema";
import { getAccountingData, defaultAccountingRange } from "@/lib/accounting-data";
import { getAppSettings } from "@/lib/app-settings";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export default async function AdminSettingsPage() {
  const { user: currentUser } = await requireSession(["ADMIN"]);
  const range = defaultAccountingRange();
  const start = new Date(`${range.from}T00:00:00+07:00`);
  const end = new Date(`${range.to}T00:00:00+07:00`);
  end.setDate(end.getDate() + 1);
  const [settings, accountRows, accounting, volumeRows] = await Promise.all([
    getAppSettings(),
    db.select({ id: user.id, name: user.name, email: user.email, appRole: user.appRole, isActive: user.isActive, isPlatformOwner: user.isPlatformOwner, createdAt: user.createdAt, employeeCode: user.employeeCode, phone: user.phone, department: user.department, monthlyTargetM3: user.monthlyTargetM3, jobTitle: user.jobTitle, age: user.age, requestedAppRole: user.requestedAppRole }).from(user).orderBy(asc(user.name)),
    getAccountingData(range.from, range.to),
    db.select({ salesRepName: orders.salesRepName, bookedM3: sql<string>`COALESCE(SUM(${orders.quantityM3}), 0)::text` }).from(orders)
      .where(and(gte(orders.requestedAt, start), lt(orders.requestedAt, end), ne(orders.status, "CANCELLED")))
      .groupBy(orders.salesRepName),
  ]);
  const bookedThisMonthM3 = volumeRows.reduce((total, row) => total + Number(row.bookedM3), 0);
  const users = accountRows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
  const monthLabel = new Intl.DateTimeFormat("vi-VN", { month: "long", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" }).format(start);
  return <AdminSettings initialSettings={settings} users={users} salesVolumes={volumeRows} monthLabel={monthLabel} currentUserId={currentUser.id} currentUserIsPlatformOwner={Boolean((currentUser as typeof currentUser & {isPlatformOwner?:boolean}).isPlatformOwner)}
    financeSummary={{ bookedThisMonthM3: String(bookedThisMonthM3), chargesThisMonthVnd: accounting.periodTotals.chargesVnd, outstandingVnd: accounting.allTimeBalanceVnd }} />;
}
