import { and, count, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appNotifications } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
const readSchema = z.object({ id: z.uuid().optional(), all: z.boolean().optional() })
  .refine((value) => Boolean(value.id) !== Boolean(value.all), "Chọn một thông báo hoặc đánh dấu tất cả.");

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "PLANNER", "SALES"].includes(session.appRole)) return NextResponse.json({ error: "Bạn không có quyền." }, { status: 403 });
  const [result] = await db.select({ unread: count() }).from(appNotifications)
    .where(and(eq(appNotifications.recipientUserId, session.user.id), isNull(appNotifications.readAt)));
  return NextResponse.json({ unread: result?.unread ?? 0 }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "PLANNER", "SALES"].includes(session.appRole)) return NextResponse.json({ error: "Bạn không có quyền." }, { status: 403 });
  const parsed = readSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ." }, { status: 400 });
  const conditions = [eq(appNotifications.recipientUserId, session.user.id), isNull(appNotifications.readAt)];
  if (parsed.data.id) conditions.push(eq(appNotifications.id, parsed.data.id));
  const changed = await db.update(appNotifications).set({ readAt: new Date() }).where(and(...conditions)).returning({ id: appNotifications.id });
  return NextResponse.json({ updated: changed.length });
}
