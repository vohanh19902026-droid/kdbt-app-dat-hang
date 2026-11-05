import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { normalizeNotificationPreferences, notificationSourceRoles } from "@/lib/notification-preferences";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const preferenceSchema = z.object({
  newBooking: z.boolean(),
  orderUpdates: z.boolean(),
  webPushEnabled: z.boolean(),
  sourceUserIds: z.array(z.string().min(1).max(128)).max(200),
});

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const roles = notificationSourceRoles(session.appRole);
  const sources = roles.length ? await db.select({ id: user.id, name: user.name, email: user.email, appRole: user.appRole })
    .from(user).where(and(eq(user.isActive, true), inArray(user.appRole, roles))) : [];
  const [record] = await db.select({ preferences: user.notificationPreferences }).from(user).where(eq(user.id, session.user.id)).limit(1);
  return NextResponse.json({
    preferences: normalizeNotificationPreferences(record?.preferences),
    sources,
    recipientRole: session.appRole,
    pushAvailable: Boolean(process.env.WEB_PUSH_VAPID_PUBLIC_KEY && process.env.WEB_PUSH_VAPID_PRIVATE_KEY),
    vapidPublicKey: process.env.WEB_PUSH_VAPID_PUBLIC_KEY || null,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const parsed = preferenceSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Thiết lập thông báo chưa hợp lệ." }, { status: 400 });
  const roles = notificationSourceRoles(session.appRole);
  const requestedIds = [...new Set(parsed.data.sourceUserIds)];
  if (requestedIds.length && !roles.length) return NextResponse.json({ error: "Tài khoản này không có nguồn nhận tin phù hợp." }, { status: 403 });
  if (requestedIds.length) {
    const valid = await db.select({ id: user.id }).from(user).where(and(eq(user.isActive, true), inArray(user.appRole, roles), inArray(user.id, requestedIds)));
    if (valid.length !== requestedIds.length) return NextResponse.json({ error: "Danh sách nguồn thông báo có tài khoản không còn hoạt động." }, { status: 400 });
  }
  const preferences = { ...parsed.data, sourceUserIds: requestedIds };
  await db.update(user).set({ notificationPreferences: preferences, updatedAt: new Date() }).where(eq(user.id, session.user.id));
  return NextResponse.json({ ok: true, preferences });
}
