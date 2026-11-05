import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getApiSession } from "@/lib/session";
import { getLegacyDebtData } from "@/lib/legacy-debt";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";
const monthPattern = /^2026-(0[1-9]|1[0-2])$/;

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "ACCOUNTANT", "SALES"].includes(session.appRole)) {
    return NextResponse.json({ error: "Bạn không có quyền xem hồ sơ công nợ lịch sử." }, { status: 403 });
  }
  const params = request.nextUrl.searchParams;
  const parsed = z.object({
    q: z.string().trim().max(120).default(""),
    month: z.string().regex(monthPattern).nullable(),
    segment: z.enum(["DA", "DC"]).nullable(),
    rosterId: z.string().max(80).nullable(),
    page: z.coerce.number().int().min(1).max(100000).default(1),
  }).safeParse({
    q: params.get("q") ?? "",
    month: params.get("month"),
    segment: params.get("segment"),
    rosterId: params.get("rosterId"),
    page: params.get("page") ?? "1",
  });
  if (!parsed.success) return NextResponse.json({ error: "Bộ lọc tra cứu chưa hợp lệ." }, { status: 400 });
  try {
    const data = await getLegacyDebtData({ userId: session.user.id, appRole: session.appRole }, {
      query: parsed.data.q,
      month: parsed.data.month,
      segment: parsed.data.segment,
      rosterId: parsed.data.rosterId,
      page: parsed.data.page,
      pageSize: 50,
    });
    return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logServerError("legacy_debt_search_failed", error, request);
    return NextResponse.json({ error: "Không tải được hồ sơ công nợ lịch sử." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
