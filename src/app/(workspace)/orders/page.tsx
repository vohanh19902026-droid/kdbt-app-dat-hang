import { and, asc, eq, gte, lt, sql } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { OrdersWorkspace } from "@/components/orders-workspace";
import { statusLabels } from "@/lib/types";
import { normalizeIsoDate, vnDateRange } from "@/lib/vn-date";

export const runtime = "nodejs";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ date?: string; view?: string }> }) {
  const { appRole, user } = await requireSession();
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
  return <OrdersWorkspace orders={data} role={appRole} date={selectedDate} view={view || "orders"} totals={totals} statusLabels={statusLabels} />;
}
