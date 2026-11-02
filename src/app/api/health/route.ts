import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check cho uptime monitor và bước xác nhận sau deploy.
 * Chỉ trả trạng thái, không lộ chuỗi kết nối hay thông tin hạ tầng.
 */
export async function GET() {
  const startedAt = Date.now();
  try {
    await db.execute(sql`select 1`);
    return NextResponse.json(
      { status: "ok", database: "up", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    logServerError("health_check_failed", error);
    return NextResponse.json(
      { status: "degraded", database: "down" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
