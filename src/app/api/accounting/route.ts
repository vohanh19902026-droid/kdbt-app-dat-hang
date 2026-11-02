import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customers, orders, receivableEntries, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { isValidIsoDate } from "@/lib/vn-date";
import { logServerError } from "@/lib/server-logger";
import { canManageReceivables, canRecordReceivableEntry, canViewReceivables, receivableEntrySchema } from "@/lib/receivables";
import { defaultAccountingRange, getAccountingData, UNASSIGNED_SALES_REP } from "@/lib/accounting-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!canViewReceivables(session.appRole)) return NextResponse.json({ error: "Bạn không có quyền xem sổ công nợ." }, { status: 403 });

  const defaults = defaultAccountingRange();
  const from = request.nextUrl.searchParams.get("from") ?? defaults.from;
  const to = request.nextUrl.searchParams.get("to") ?? defaults.to;
  const salesRepId = session.appRole === "SALES" ? session.user.id : request.nextUrl.searchParams.get("salesRepId") || null;
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    return NextResponse.json({ error: "Khoảng ngày không hợp lệ." }, { status: 400 });
  }
  if (salesRepId && salesRepId !== UNASSIGNED_SALES_REP && !z.string().min(1).max(128).safeParse(salesRepId).success) {
    return NextResponse.json({ error: "Nhân viên kinh doanh không hợp lệ." }, { status: 400 });
  }
  try {
    const data = await getAccountingData(from, to, salesRepId, { ownerSalesRepId: session.appRole === "SALES" ? session.user.id : undefined });
    if (salesRepId && salesRepId !== UNASSIGNED_SALES_REP && !data.salesReps.some((rep) => rep.id === salesRepId)) {
      return NextResponse.json({ error: "Không tìm thấy nhân viên kinh doanh." }, { status: 400 });
    }
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logServerError("accounting_list_failed", error, request);
    return NextResponse.json({ error: "Không tải được sổ công nợ." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function PATCH(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!canManageReceivables(session.appRole)) return NextResponse.json({ error: "Chỉ Kế toán hoặc Admin được phân công khách hàng." }, { status: 403 });
  const schema = z.object({ customerId: z.uuid(), salesRepId: z.string().max(128) });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thông tin phân công chưa hợp lệ." }, { status: 400 });
  const { customerId, salesRepId } = parsed.data;
  if (salesRepId) {
    const [rep] = await db.select({ id: user.id }).from(user)
      .where(and(eq(user.id, salesRepId), eq(user.appRole, "SALES"), eq(user.isActive, true))).limit(1);
    if (!rep) return NextResponse.json({ error: "Chỉ được giao cho nhân viên kinh doanh đang hoạt động." }, { status: 400 });
  }
  const [customer] = await db.update(customers).set({ salesRepId: salesRepId || null, updatedAt: new Date() })
    .where(eq(customers.id, customerId)).returning({ id: customers.id });
  if (!customer) return NextResponse.json({ error: "Không tìm thấy khách hàng." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const parsed = receivableEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Thông tin ghi sổ chưa hợp lệ." }, { status: 400 });
  }
  const data = parsed.data;
  if (!canRecordReceivableEntry(session.appRole, data.entryType)) {
    return NextResponse.json({ error: "Bạn không có quyền ghi loại giao dịch này." }, { status: 403 });
  }

  try {
    const entry = await db.transaction(async (tx) => {
      const [customer] = await tx.select({ id: customers.id, isActive: customers.isActive, salesRepId: customers.salesRepId })
        .from(customers).where(eq(customers.id, data.customerId)).for("update").limit(1);
      if (!customer || !customer.isActive) throw new Error("CUSTOMER_NOT_FOUND");
      if (session.appRole === "SALES" && customer.salesRepId !== session.user.id) throw new Error("CUSTOMER_NOT_OWNED");

      if (data.orderId) {
        const [order] = await tx.select({ id: orders.id, customerId: orders.customerId })
          .from(orders).where(eq(orders.id, data.orderId)).limit(1);
        if (!order) throw new Error("ORDER_NOT_FOUND");
        if (order.customerId !== customer.id) throw new Error("ORDER_CUSTOMER_MISMATCH");
      }

      const [createdEntry] = await tx.insert(receivableEntries).values({
        customerId: customer.id,
        orderId: data.orderId ?? null,
        entryType: data.entryType,
        amountVnd: String(data.amountVnd),
        referenceNo: data.referenceNo || null,
        occurredAt: new Date(`${data.occurredOn}T12:00:00+07:00`),
        note: data.note || null,
        createdBy: session.user.id,
      }).returning({ id: receivableEntries.id });
      return createdEntry;
    });

    return NextResponse.json({ id: entry.id, message: data.entryType === "CHARGE" ? "Đã ghi nhận khoản phải thu." : "Đã ghi nhận khoản thu tiền." }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "CUSTOMER_NOT_FOUND") return NextResponse.json({ error: "Không tìm thấy khách hàng đang hoạt động." }, { status: 404 });
    if (error instanceof Error && error.message === "CUSTOMER_NOT_OWNED") return NextResponse.json({ error: "Khách hàng này không thuộc danh sách được giao cho bạn." }, { status: 403 });
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") return NextResponse.json({ error: "Không tìm thấy booking." }, { status: 404 });
    if (error instanceof Error && error.message === "ORDER_CUSTOMER_MISMATCH") return NextResponse.json({ error: "Booking không thuộc khách hàng đã chọn." }, { status: 400 });
    logServerError("accounting_entry_create_failed", error, request);
    return NextResponse.json({ error: "Không ghi được giao dịch công nợ." }, { status: 500 });
  }
}
