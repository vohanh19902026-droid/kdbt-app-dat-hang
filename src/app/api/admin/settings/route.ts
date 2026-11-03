import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { defaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import { archivedProductCatalogSchema, defaultProductCatalog, emptyArchivedProductCatalog, productCatalogSchema } from "@/lib/product-catalog";

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
  catalog: productCatalogSchema,
  catalogArchived: archivedProductCatalogSchema.default(emptyArchivedProductCatalog),
}).superRefine((settings, context) => {
  for (const key of Object.keys(settings.catalog) as Array<keyof typeof settings.catalog>) {
    const activeValues = new Set(settings.catalog[key].map((value) => String(value).trim().toLocaleLowerCase("vi")));
    const archivedSeen = new Set<string>();
    for (const value of settings.catalogArchived[key]) {
      const normalized = value.trim().toLocaleLowerCase("vi");
      if (activeValues.has(normalized) || archivedSeen.has(normalized)) {
        context.addIssue({ code: "custom", path: ["catalogArchived", key], message: "Mục đang dùng và đã ngừng dùng phải riêng biệt, không được lặp." });
        break;
      }
      archivedSeen.add(normalized);
    }
  }
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
  return NextResponse.json(normalizeAppSettings(row?.settings));
}

export async function PUT(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const auth = await authorize(request);
  if ("response" in auth) return auth.response;
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Cài đặt chưa hợp lệ." }, { status: 400 });
  const conflict = await db.transaction(async (tx) => {
    const [stored] = await tx.select({ values: appSettings.values }).from(appSettings).where(eq(appSettings.id, "default")).for("update").limit(1);
    const rawSettings = stored?.values as Record<string, unknown> | undefined;
    const storedCatalog = productCatalogSchema.safeParse(rawSettings?.catalog ?? defaultProductCatalog);
    const storedArchived = archivedProductCatalogSchema.safeParse(rawSettings?.catalogArchived ?? emptyArchivedProductCatalog);
    if (!storedCatalog.success || !storedArchived.success) return "Danh mục lưu trên máy chủ cần được rà soát. Cài đặt chưa được thay đổi.";
    for (const key of Object.keys(storedCatalog.data) as Array<keyof typeof storedCatalog.data>) {
      const activeValues = new Set(storedCatalog.data[key].map((value) => String(value).toLocaleLowerCase("vi")));
      if (storedArchived.data[key].some((value) => activeValues.has(value.toLocaleLowerCase("vi")))) {
        return "Danh mục lưu trên máy chủ có mục bị trùng. Cài đặt chưa được thay đổi.";
      }
    }
    const previous = normalizeAppSettings(stored?.values);
    for (const key of Object.keys(previous.catalog) as Array<keyof typeof previous.catalog>) {
      const activeBefore = previous.catalog[key].map((value) => String(value).toLocaleLowerCase("vi"));
      const archivedBefore = previous.catalogArchived[key].map((value) => value.toLocaleLowerCase("vi"));
      const activeAfter = new Set(parsed.data.catalog[key].map((value) => String(value).toLocaleLowerCase("vi")));
      const archivedAfter = new Set(parsed.data.catalogArchived[key].map((value) => value.toLocaleLowerCase("vi")));
      if (activeBefore.some((value) => !activeAfter.has(value)) || archivedBefore.some((value) => !archivedAfter.has(value))) {
        return "Không thể xóa hoặc ngừng dùng danh mục bằng cách lưu cấu hình chung. Hãy quản lý từng mục trong tab Danh mục đặt hàng.";
      }
    }
    const now = new Date();
    await tx.insert(appSettings).values({ id: "default", values: parsed.data, updatedBy: auth.session.user.id, updatedAt: now })
      .onConflictDoUpdate({ target: appSettings.id, set: { values: parsed.data, updatedBy: auth.session.user.id, updatedAt: now } });
    return null;
  });
  if (conflict) return NextResponse.json({ error: conflict }, { status: 409 });
  return NextResponse.json({ ok: true, settings: parsed.data });
}
