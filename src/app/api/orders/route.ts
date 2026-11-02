import { and, asc, eq, gte, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orderEvents, orders, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { normalizeIsoDate, vnDateRange } from "@/lib/vn-date";
import { statusLabels } from "@/lib/types";
import { logServerError } from "@/lib/server-logger";
import { resolveBookingCustomer } from "@/lib/booking-customer";

export const runtime = "nodejs";
const createSchema = z.object({
  customerId: z.uuid().optional(),
  customerName: z.string().trim().min(2).max(180),
  siteAddress: z.string().trim().min(3).max(500),
  contactName: z.string().trim().max(120).optional().default(""),
  contactPhone: z.string().trim().max(30).optional().default(""),
  requestedAt: z.coerce.date(),
  quantityM3: z.coerce.number().positive().max(5000),
  grade: z.string().trim().min(1).max(80),
  sandType: z.string().trim().min(1).max(100),
  stoneType: z.string().trim().min(1).max(100),
  pumpRequired: z.string().trim().max(100).optional().default("Không bơm"),
  truckCapacityM3: z.coerce.number().positive().optional(),
  salesNote: z.string().trim().max(1000).optional().default(""),
  pourType: z.string().trim().max(120).optional().default(""),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.appRole === "ACCOUNTANT") return NextResponse.json({ error: "Phân hệ kế toán chưa được mở." }, { status: 403 });
  // Luôn giới hạn theo một ngày: tránh tải toàn bộ bảng khi tham số ngày trống hoặc sai.
  const date = normalizeIsoDate(request.nextUrl.searchParams.get("date"));
  const { from, to } = vnDateRange(date);
  const conditions = [gte(orders.requestedAt, from), lt(orders.requestedAt, to)];
  if (session.appRole === "SALES") conditions.push(eq(orders.createdBy, session.user.id));
  const rows = await db.select({ order: orders, createdByName: user.name }).from(orders)
    .leftJoin(user, eq(orders.createdBy, user.id))
    .where(and(...conditions))
    .orderBy(asc(orders.plannedStartAt), asc(orders.requestedAt))
    .limit(2000);
  return NextResponse.json(rows.map(({ order, createdByName }) => ({
    ...order, createdByName,
    quantityM3: Number(order.quantityM3), actualM3: Number(order.actualM3),
    truckCapacityM3: order.truckCapacityM3 ? Number(order.truckCapacityM3) : null,
    statusLabel: statusLabels[order.status],
  })));
}

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "PLANNER", "SALES"].includes(session.appRole)) {
    return NextResponse.json({ error: "Bạn không có quyền tạo booking." }, { status: 403 });
  }
  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Thông tin đơn hàng chưa hợp lệ." }, { status: 400 });
  const data = parsed.data;
  try {
    const created = await db.transaction(async (tx) => {
      const customer = await resolveBookingCustomer(tx, data, { id: session.user.id, role: session.appRole });
      const [order] = await tx.insert(orders).values({
        customerId: customer.id, customerName: customer.name, salesRepName: session.user.name,
        siteAddress: data.siteAddress, contactName: data.contactName || null,
        contactPhone: data.contactPhone || null, requestedAt: data.requestedAt,
        quantityM3: String(data.quantityM3), grade: data.grade, sandType: data.sandType,
        stoneType: data.stoneType, pumpRequired: data.pumpRequired,
        truckCapacityM3: data.truckCapacityM3 ? String(data.truckCapacityM3) : null,
        salesNote: data.salesNote || null, pourType: data.pourType || null, createdBy: session.user.id,
      }).returning();
      await tx.insert(orderEvents).values({
        orderId: order.id, actorUserId: session.user.id, eventType: "ORDER_CREATED",
        newValue: JSON.stringify({ bookingNo: order.bookingNo, quantityM3: data.quantityM3 }),
      });
      return order;
    });
    return NextResponse.json({ order: created, message: `Đã tạo booking ${created.bookingNo}` }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "INVALID_CUSTOMER") {
      return NextResponse.json({ error: "Khách hàng không tồn tại hoặc bạn không được chọn khách hàng này." }, { status: 400 });
    }
    logServerError("create_order_failed", error, request);
    return NextResponse.json({ error: "Chưa lưu được đơn hàng. Vui lòng thử lại." }, { status: 500 });
  }
}
