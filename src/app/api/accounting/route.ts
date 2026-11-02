import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, orders, receivableEntries } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { isValidIsoDate } from "@/lib/vn-date";
import { logServerError } from "@/lib/server-logger";
import { canAccessReceivables, receivableEntrySchema } from "@/lib/receivables";
import { defaultAccountingRange, getAccountingData } from "@/lib/accounting-data";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!canAccessReceivables(session.appRole)) return NextResponse.json({ error: "Chỉ kế toán hoặc Admin được xem sổ công nợ." }, { status: 403 });

  const defaults = defaultAccountingRange();
  const from = request.nextUrl.searchParams.get("from") ?? defaults.from;
  const to = request.nextUrl.searchParams.get("to") ?? defaults.to;
  if (!isValidIsoDate(from) || !isValidIsoDate(to)) {
    return NextResponse.json({ error: "Khoảng ngày không hợp lệ." }, { status: 400 });
  }
  try {
    const data = await getAccountingData(from, to);
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logServerError("accounting_list_failed", error, request);
    return NextResponse.json({ error: "Không tải được sổ công nợ." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!canAccessReceivables(session.appRole)) return NextResponse.json({ error: "Chỉ kế toán hoặc Admin được ghi sổ công nợ." }, { status: 403 });

  const parsed = receivableEntrySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Thông tin ghi sổ chưa hợp lệ." }, { status: 400 });
  }
  const data = parsed.data;

  try {
    const [customer] = await db.select({ id: customers.id, isActive: customers.isActive })
      .from(customers).where(eq(customers.id, data.customerId)).limit(1);
    if (!customer || !customer.isActive) return NextResponse.json({ error: "Không tìm thấy khách hàng đang hoạt động." }, { status: 404 });

    if (data.orderId) {
      const [order] = await db.select({ id: orders.id, customerId: orders.customerId })
        .from(orders).where(eq(orders.id, data.orderId)).limit(1);
      if (!order) return NextResponse.json({ error: "Không tìm thấy booking." }, { status: 404 });
      if (order.customerId !== customer.id) return NextResponse.json({ error: "Booking không thuộc khách hàng đã chọn." }, { status: 400 });
    }

    const [entry] = await db.insert(receivableEntries).values({
      customerId: customer.id,
      orderId: data.orderId ?? null,
      entryType: data.entryType,
      amountVnd: String(data.amountVnd),
      referenceNo: data.referenceNo || null,
      occurredAt: new Date(`${data.occurredOn}T12:00:00+07:00`),
      note: data.note || null,
      createdBy: session.user.id,
    }).returning({ id: receivableEntries.id });

    return NextResponse.json({ id: entry.id, message: data.entryType === "CHARGE" ? "Đã ghi nhận khoản phải thu." : "Đã ghi nhận khoản thu tiền." }, { status: 201 });
  } catch (error) {
    logServerError("accounting_entry_create_failed", error, request);
    return NextResponse.json({ error: "Không ghi được giao dịch công nợ." }, { status: 500 });
  }
}
