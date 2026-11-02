import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/session";
import { canViewReceivables } from "@/lib/receivables";
import { isValidIsoDate } from "@/lib/vn-date";
import { ACCOUNTING_EXPORT_MAX_ENTRIES, defaultAccountingRange, getAccountingData, UNASSIGNED_SALES_REP } from "@/lib/accounting-data";
import { createAccountingWorkbook } from "@/lib/accounting-workbook";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!canViewReceivables(session.appRole)) {
    return NextResponse.json({ error: "Bạn không có quyền xuất sổ công nợ." }, { status: 403 });
  }

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
    const data = await getAccountingData(from, to, salesRepId, { exportAllEntries: true, ownerSalesRepId: session.appRole === "SALES" ? session.user.id : undefined });
    if (salesRepId && salesRepId !== UNASSIGNED_SALES_REP && !data.salesReps.some((rep) => rep.id === salesRepId)) {
      return NextResponse.json({ error: "Không tìm thấy nhân viên kinh doanh." }, { status: 400 });
    }
    const workbook = createAccountingWorkbook(data);
    const buffer = await workbook.xlsx.writeBuffer();
    const suffix = data.salesRepFilterLabel.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "tat-ca-nvkd";
    const filename = `so-cong-no-${data.period.from}-den-${data.period.to}-${suffix}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof RangeError && error.message === "ACCOUNTING_EXPORT_TOO_LARGE") {
      return NextResponse.json({ error: `Có hơn ${ACCOUNTING_EXPORT_MAX_ENTRIES.toLocaleString("vi-VN")} giao dịch trong khoảng chọn. Hãy chọn khoảng ngày ngắn hơn để xuất đầy đủ.` }, { status: 400 });
    }
    logServerError("accounting_export_failed", error, request);
    return NextResponse.json({ error: "Không tạo được file sổ công nợ." }, { status: 500 });
  }
}
