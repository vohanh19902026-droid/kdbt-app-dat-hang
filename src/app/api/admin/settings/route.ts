import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { defaultAppSettings } from "@/lib/app-settings";

export const runtime = "nodejs";

const settingsSchema = z.object({
  companyName: z.string().trim().min(2).max(80),
  companySubtitle: z.string().trim().max(100),
  companyPhone: z.string().trim().max(30),
  companyEmail: z.union([z.email().max(254), z.literal("")]),
  companyAddress: z.string().trim().max(200),
  themeMode: z.enum(["light", "dark"]),
  accentColor: z.enum(["green", "blue", "purple", "red", "amber"]),
  fontFamily: z.enum(["dm-sans", "manrope", "system"]),
  fontScale: z.number().int().min(85).max(125),
});

async function authorize(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return { response: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  if (session.appRole !== "ADMIN") return { response: NextResponse.json({ error: "Chỉ Admin được thay đổi cài đặt." }, { status: 403 }) };
  return { session };
}

export async function GET(request: NextRequest) {
  const auth = await authorize(request);
  if ("response" in auth) return auth.response;
  const [row] = await db.select({ settings: appSettings.values }).from(appSettings).where(eq(appSettings.id, "default")).limit(1);
  return NextResponse.json({ ...defaultAppSettings, ...(row?.settings ?? {}) });
}

export async function PUT(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const auth = await authorize(request);
  if ("response" in auth) return auth.response;
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Cài đặt chưa hợp lệ." }, { status: 400 });
  const now = new Date();
  await db.insert(appSettings).values({ id: "default", values: parsed.data, updatedBy: auth.session.user.id, updatedAt: now })
    .onConflictDoUpdate({ target: appSettings.id, set: { values: parsed.data, updatedBy: auth.session.user.id, updatedAt: now } });
  return NextResponse.json({ ok: true, settings: parsed.data });
}
