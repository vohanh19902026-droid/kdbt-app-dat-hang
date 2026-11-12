import { and, asc, count, eq, gte, ilike, isNull, lt, or, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { OrdersWorkspace } from "@/components/orders-workspace";
import { statusLabels, type OrderStatus } from "@/lib/types";
import { normalizeIsoDate, vnDateRange } from "@/lib/vn-date";
import { getAppSettings } from "@/lib/app-settings";

export const runtime = "nodejs";

const PAGE_SIZE = 20;
const allowedStatuses = new Set<string>(Object.keys(statusLabels));

export default async function OrdersPage({ searchParams }: {
  searchParams: Promise<{ date?: string; view?: string; page?: string; q?: string; status?: string }>;
}) {
  const { appRole, user } = await requireSession();
  if (appRole === "ACCOUNTANT") redirect("/accounting?denied=1");
  if (appRole === "TECHNICAL") redirect("/technical/catalog");
  const params = await searchParams;
  const selectedDate = normalizeIsoDate(params.date);
  const { from, to } = vnDateRange(selectedDate);
  const planningView = params.view === "planning";
  const receivingView = params.view === "receiving";
  const view = params.view || "orders";
  const basis = planningView
    ? sql<Date>`COALESCE(${orders.plannedStartAt}, ${orders.requestedAt})`
    : sql<Date>`${orders.requestedAt}`;
  const baseConditions = [gte(basis, from), lt(basis, to)];
  if (planningView) baseConditions.push(sql`${orders.status} IN ('APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED')`);
  if (receivingView) baseConditions.push(eq(orders.status, "PENDING"));
  if (appRole === "SALES") baseConditions.push(eq(orders.createdBy, user.id));

  const search = (params.q || "").trim().slice(0, 120);
  const requestedStatus = params.status || "ALL";
  const status = allowedStatuses.has(requestedStatus) ? requestedStatus as OrderStatus : "ALL";
  const pageNumber = Number.parseInt(params.page || "1", 10);
  const page = Number.isSafeInteger(pageNumber) && pageNumber > 0 ? Math.min(pageNumber, 100_000) : 1;
  const listConditions = [...baseConditions];
  if (status !== "ALL") listConditions.push(eq(orders.status, status));
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, "\\$&")}%`;
    listConditions.push(or(
      ilike(orders.bookingNo, pattern), ilike(orders.customerName, pattern),
      ilike(orders.siteAddress, pattern), ilike(orders.salesRepName, pattern),
    )!);
  }

  const [rows, [aggregate], settings] = await Promise.all([
    db.select().from(orders).where(and(...listConditions))
      .orderBy(asc(basis), asc(orders.requestedAt), asc(orders.id))
      .limit(PAGE_SIZE + 1).offset((page - 1) * PAGE_SIZE),
    db.select({
      total: count(),
      ordered: sql<string>`COALESCE(SUM(${orders.quantityM3}), 0)`,
      actual: sql<string>`COALESCE(SUM(${orders.actualM3}), 0)`,
      pending: sql<string>`COUNT(*) FILTER (WHERE ${orders.status} = 'PENDING')`,
      ongoing: sql<string>`COUNT(*) FILTER (WHERE ${orders.status} = 'IN_PROGRESS')`,
    }).from(orders).where(and(...baseConditions)),
    getAppSettings(),
  ]);
  const hasNextPage = rows.length > PAGE_SIZE;
  const data = rows.slice(0, PAGE_SIZE).map((order) => ({
    ...order,
    quantityM3: Number(order.quantityM3),
    actualM3: Number(order.actualM3),
    truckCapacityM3: order.truckCapacityM3 ? Number(order.truckCapacityM3) : null,
  }));
  const totals = {
    ordered: Number(aggregate?.ordered || 0),
    actual: Number(aggregate?.actual || 0),
    pending: Number(aggregate?.pending || 0),
    ongoing: Number(aggregate?.ongoing || 0),
  };
  return <OrdersWorkspace
    key={`${selectedDate}:${view}:${page}:${search}:${status}`}
    orders={data}
    catalog={settings.catalog}
    role={appRole}
    date={selectedDate}
    view={view}
    totals={totals}
    totalOrders={Number(aggregate?.total || 0)}
    page={page}
    pageSize={PAGE_SIZE}
    hasNextPage={hasNextPage}
    searchQuery={search}
    statusFilter={status}
  />;
}
