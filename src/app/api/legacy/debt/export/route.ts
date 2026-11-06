import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/session";
import { getLegacyDebtExportRows } from "@/lib/legacy-debt";
import { createLegacyDebtWorkbook } from "@/lib/legacy-debt-workbook";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";
const monthPattern = /^2026-(0[1-9]|1[0-2])$/;

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "ACCOUNTANT", "SALES"].includes(session.appRole)) {
    return NextResponse.json({ error: "Bạn không có quyền xuất hồ sơ công nợ lịch sử." }, { status: 403 });
  }
  const params = request.nextUrl.searchParams;
  const parsed = z.object({
    q: z.string().trim().max(120).default(""),
    month: z.string().regex(monthPattern).nullable(),
    segment: z.enum(["DA", "DC"]).nullable(),
    rosterId: z.string().max(80).nullable(),
  }).safeParse({ q: params.get("q") ?? "", month: params.get("month"), segment: params.get("segment"), rosterId: params.get("rosterId") });
  if (!parsed.success) return NextResponse.json({ error: "Bộ lọc xuất chưa hợp lệ." }, { status: 400 });
  try {
    const filters = { query: parsed.data.q, month: parsed.data.month, segment: parsed.data.segment, rosterId: parsed.data.rosterId };
    const rows = await getLegacyDebtExportRows({ userId: session.user.id, appRole: session.appRole }, filters, 10000);
    const workbook = createLegacyDebtWorkbook(rows, filters);
    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `cencom-cong-no-lich-su-${new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" })}.xlsx`;
    return new NextResponse(new Uint8Array(buffer), { headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "no-store",
    } });
  } catch (error) {
    if (error instanceof RangeError && error.message === "LEGACY_EXPORT_TOO_LARGE") {
      return NextResponse.json({ error: "Kết quả vượt quá 10.000 dòng. Hãy lọc theo kỳ, phân hệ hoặc từ khóa rồi xuất lại." }, { status: 400 });
    }
    logServerError("legacy_debt_export_failed", error, request);
    return NextResponse.json({ error: "Không tạo được XLSX công nợ lịch sử." }, { status: 500 });
  }
}
