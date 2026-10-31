import { and, asc, gte, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { createPlanWorkbook } from "@/lib/plan-workbook";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "PLANNER"].includes(session.appRole)) {
    return NextResponse.json({ error: "Bạn không có quyền xuất bảng kế hoạch." }, { status: 403 });
  }
  const date = request.nextUrl.searchParams.get("date") || new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Ngày xuất không hợp lệ." }, { status: 400 });

  const from = new Date(`${date}T00:00:00+07:00`);
  const to = new Date(from.getTime() + 86_400_000);
  const rows = await db.select().from(orders)
    .where(and(gte(orders.requestedAt, from), lt(orders.requestedAt, to)))
    .orderBy(asc(orders.plannedStartAt), asc(orders.requestedAt));
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
