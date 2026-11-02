import { desc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orderEvents, orders, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { statusLabels } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.appRole === "ACCOUNTANT") {
    return NextResponse.json({ error: "Phân hệ kế toán chưa được mở." }, { status: 403 });
  }

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Mã booking không hợp lệ." }, { status: 400 });
  }

  const [order] = await db.select({ id: orders.id, createdBy: orders.createdBy, bookingNo: orders.bookingNo })
    .from(orders).where(eq(orders.id, id)).limit(1);
  if (!order) return NextResponse.json({ error: "Không tìm thấy booking." }, { status: 404 });
  // Nhân viên kinh doanh chỉ được xem lịch sử booking do chính mình tạo.
  if (session.appRole === "SALES" && order.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Bạn không có quyền xem booking này." }, { status: 403 });
  }

  const rows = await db.select({
    id: orderEvents.id,
    eventType: orderEvents.eventType,
    fieldName: orderEvents.fieldName,
    oldValue: orderEvents.oldValue,
    newValue: orderEvents.newValue,
    createdAt: orderEvents.createdAt,
    actorName: user.name,
  }).from(orderEvents)
    .leftJoin(user, eq(orderEvents.actorUserId, user.id))
    .where(eq(orderEvents.orderId, id))
    .orderBy(desc(orderEvents.createdAt))
    .limit(300);

  return NextResponse.json({
    bookingNo: order.bookingNo,
    events: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
      eventLabel: statusLabels[row.eventType as keyof typeof statusLabels] ?? (row.eventType === "ORDER_CREATED" ? "Tạo booking" : row.eventType === "ORDER_UPDATED" ? "Cập nhật" : row.eventType),
    })),
  });
}
