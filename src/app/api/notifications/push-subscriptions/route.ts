import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
const subscriptionSchema = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({ p256dh: z.string().min(20).max(256), auth: z.string().min(8).max(256) }),
}).superRefine(({ endpoint }, context) => {
  let url: URL;
  try { url = new URL(endpoint); } catch { return; }
  const host = url.hostname.toLowerCase();
  const allowed = host === "fcm.googleapis.com" || host.endsWith(".push.services.mozilla.com")
    || host === "notify.windows.com" || host === "web.push.apple.com";
  if (url.protocol !== "https:" || !allowed) context.addIssue({ code: "custom", path: ["endpoint"], message: "Địa chỉ dịch vụ push không được hỗ trợ." });
});

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Thiết bị chưa đăng ký nhận tin được." }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  const now = new Date();
  await db.insert(pushSubscriptions).values({ userId: session.user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null, updatedAt: now })
    .onConflictDoUpdate({ target: [pushSubscriptions.userId, pushSubscriptions.endpoint], set: { p256dh: keys.p256dh, auth: keys.auth, userAgent: request.headers.get("user-agent")?.slice(0, 500) ?? null, updatedAt: now } });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const parsed = z.object({ endpoint: z.string().url().max(2048) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thiết bị chưa được đăng ký." }, { status: 400 });
  await db.delete(pushSubscriptions).where(and(eq(pushSubscriptions.userId, session.user.id), eq(pushSubscriptions.endpoint, parsed.data.endpoint)));
  return NextResponse.json({ ok: true });
}
