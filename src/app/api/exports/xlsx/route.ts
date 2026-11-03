import { and, asc, gte, inArray, lt, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { createPlanWorkbook } from "@/lib/plan-workbook";
import { isValidIsoDate, todayVN, vnDateRange } from "@/lib/vn-date";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "PLANNER"].includes(session.appRole)) {
    return NextResponse.json({ error: "Bạn không có quyền xuất bảng kế hoạch." }, { status: 403 });
  }
  const requested = request.nextUrl.searchParams.get("date");
  if (requested !== null && !isValidIsoDate(requested)) {
    return NextResponse.json({ error: "Ngày xuất không hợp lệ (YYYY-MM-DD)." }, { status: 400 });
  }
  const date = requested ?? todayVN();
  const { from, to } = vnDateRange(date);

  // Bảng kế hoạch đi theo ngày cấp hàng; đơn chưa xếp lịch vẫn hiện theo ngày yêu cầu.
  const plannedAt = sql`COALESCE(${orders.plannedStartAt}, ${orders.requestedAt})`;
  const rows = await db.select().from(orders)
    .where(and(gte(plannedAt, from), lt(plannedAt, to), inArray(orders.status, ["APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED"])))
    .orderBy(asc(orders.plannedStartAt), asc(orders.requestedAt))
    .limit(5001);
  if (rows.length > 5000) {
    return NextResponse.json({ error: "Ngày này có hơn 5.000 booking. Không thể xuất đầy đủ trong một file; vui lòng liên hệ quản trị viên." }, { status: 400 });
  }
  const workbook = createPlanWorkbook(date, from, rows);
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `ke-hoach-cap-be-tong-${date}.xlsx`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    },
  });
}
