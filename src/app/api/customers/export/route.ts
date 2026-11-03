import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { createCustomerExportWorkbook } from "@/lib/customer-workbook";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "PLANNER"].includes(session.appRole)) return NextResponse.json({ error: "Bạn không có quyền xuất danh mục khách hàng." }, { status: 403 });
  try {
    const rows = await db.select({ name: customers.name, phone: customers.phone, defaultAddress: customers.defaultAddress,
      salesRepName: user.name, employeeCode: user.employeeCode, isActive: customers.isActive, createdAt: customers.createdAt })
      .from(customers).leftJoin(user, eq(customers.salesRepId, user.id)).orderBy(asc(customers.name), asc(customers.id)).limit(10001);
    if (rows.length > 10000) return NextResponse.json({ error: "Danh mục vượt quá 10.000 khách hàng. Hãy lọc bớt trước khi xuất." }, { status: 400 });
    const workbook = createCustomerExportWorkbook(rows);
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `danh-muc-khach-hang-${new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    logServerError("customers_export_failed", error, request);
    return NextResponse.json({ error: "Không tạo được file danh mục khách hàng." }, { status: 500 });
  }
}
