import { and, asc, eq, gte, isNull, lt, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { customers, orders } from "@/db/schema";
import { OrdersWorkspace } from "@/components/orders-workspace";
import { statusLabels } from "@/lib/types";
import { normalizeIsoDate, vnDateRange } from "@/lib/vn-date";

export const runtime = "nodejs";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  const { appRole, user } = await requireSession();
  // Kế toán chỉ dùng phân hệ công nợ; không để redirect từ trang bị cấm làm lộ danh sách booking.
  if (appRole === "ACCOUNTANT") redirect("/accounting?denied=1");
  const { date, view } = await searchParams;
  const selectedDate = normalizeIsoDate(date);
  const { from, to } = vnDateRange(selectedDate);
  // Bảng điều phối lọc theo ngày cấp hàng; đơn chưa xếp lịch vẫn nằm ở ngày yêu cầu.
  const planningView = view === "planning";
  const basis = planningView
    ? sql<Date>`COALESCE(${orders.plannedStartAt}, ${orders.requestedAt})`
    : sql<Date>`${orders.requestedAt}`;
  const conditions = [gte(basis, from), lt(basis, to)];
  if (appRole === "SALES") conditions.push(eq(orders.createdBy, user.id));
  const rows = await db.select().from(orders).where(and(...conditions))
    .orderBy(asc(orders.plannedStartAt), asc(orders.requestedAt))
    .limit(2000);
  const customerOptions = await db.select({ id: customers.id, name: customers.name, phone: customers.phone, address: customers.defaultAddress })
    .from(customers)
    .where(and(eq(customers.isActive, true), appRole === "SALES" ? or(eq(customers.salesRepId, user.id), isNull(customers.salesRepId)) : undefined))
    .orderBy(asc(customers.name), asc(customers.id));
  const data = rows.map((order) => ({
    ...order,
    quantityM3: Number(order.quantityM3),
    actualM3: Number(order.actualM3),
    truckCapacityM3: order.truckCapacityM3 ? Number(order.truckCapacityM3) : null,
  }));
  const totals = {
    ordered: data.reduce((sum, order) => sum + order.quantityM3, 0),
    actual: data.reduce((sum, order) => sum + order.actualM3, 0),
    pending: data.filter((order) => order.status === "PENDING").length,
    ongoing: data.filter((order) => order.status === "IN_PROGRESS").length,
  };
  return <OrdersWorkspace orders={data} customerOptions={customerOptions} role={appRole} date={selectedDate} view={view || "orders"} totals={totals} statusLabels={statusLabels} />;
}
