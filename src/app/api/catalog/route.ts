import { desc, eq, sql } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditEvents, appSettings, orders, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { defaultAppSettings, normalizeAppSettings } from "@/lib/app-settings";
import { archivedProductCatalogSchema, defaultProductCatalog, emptyArchivedProductCatalog, productCatalogSchema, type ProductCatalogKey } from "@/lib/product-catalog";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";
class CatalogOperationError extends Error {}

const operationSchema = z.object({
  key: z.enum(["grades", "sandTypes", "stoneTypes", "pumpTypes", "serviceVehicles", "truckCapacitiesM3", "pourTypes", "pourMethods", "siteCategories"]),
  action: z.enum(["add", "disable", "restore", "delete"]),
  value: z.string().trim().min(1).max(120),
});

const orderFieldByCatalog: Record<ProductCatalogKey, AnyPgColumn> = {
  grades: orders.grade,
  sandTypes: orders.sandType,
  stoneTypes: orders.stoneType,
  pumpTypes: orders.pumpRequired,
  serviceVehicles: orders.assignedVehicle,
  truckCapacitiesM3: orders.truckCapacityM3,
  pourTypes: orders.pourType,
  pourMethods: orders.pourMethod,
  siteCategories: orders.siteCategory,
};

const equalValue = (left: string | number, right: string) => String(left).trim().toLocaleLowerCase("vi") === right.trim().toLocaleLowerCase("vi");

async function authorize(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return { response: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  if (!["ADMIN", "TECHNICAL"].includes(session.appRole)) return { response: NextResponse.json({ error: "Chỉ Admin hoặc Kỹ thuật được quản lý danh mục." }, { status: 403 }) };
  return { session };
}

export async function GET(request: NextRequest) {
  const access = await authorize(request);
  if ("response" in access) return access.response;
  const [row] = await db.select({ values: appSettings.values }).from(appSettings).where(eq(appSettings.id, "default")).limit(1);
  const settings = normalizeAppSettings(row?.values);
  const audit = access.session.appRole === "ADMIN"
    ? await db.select({ eventType: adminAuditEvents.eventType, entityKey: adminAuditEvents.entityKey, oldValue: adminAuditEvents.oldValue, newValue: adminAuditEvents.newValue, createdAt: adminAuditEvents.createdAt, actorName: user.name })
      .from(adminAuditEvents).innerJoin(user, eq(adminAuditEvents.actorUserId, user.id)).orderBy(desc(adminAuditEvents.createdAt)).limit(20)
    : [];
  return NextResponse.json({ catalog: settings.catalog, catalogArchived: settings.catalogArchived, audit });
}

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const access = await authorize(request);
  if ("response" in access) return access.response;
  const parsed = operationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Danh mục chưa hợp lệ." }, { status: 400 });
  const { key, action } = parsed.data;
  if (access.session.appRole === "TECHNICAL" && !["grades", "sandTypes", "stoneTypes", "pumpTypes"].includes(key)) {
    return NextResponse.json({ error: "Kỹ thuật chỉ được quản lý mác bê tông, cát, đá và xe bơm." }, { status: 403 });
  }
  const value = key === "truckCapacitiesM3" ? String(Number(parsed.data.value)) : parsed.data.value.trim();
  if (key === "truckCapacitiesM3" && (!Number.isFinite(Number(value)) || Number(value) <= 0 || Number(value) > 30)) {
    return NextResponse.json({ error: "Dung tích xe phải lớn hơn 0 và không vượt quá 30 m³." }, { status: 400 });
  }
  if (action === "delete" && access.session.appRole !== "ADMIN") {
    return NextResponse.json({ error: "Chỉ Admin được xóa hẳn mục đã ngừng dùng." }, { status: 403 });
  }

  try {
    const settings = await db.transaction(async (tx) => {
      const [row] = await tx.select({ values: appSettings.values }).from(appSettings).where(eq(appSettings.id, "default")).for("update").limit(1);
      const current = normalizeAppSettings(row?.values ?? defaultAppSettings);
      const rawCatalog = productCatalogSchema.safeParse(current.catalog);
      const rawArchived = archivedProductCatalogSchema.safeParse(current.catalogArchived);
      if (!rawCatalog.success || !rawArchived.success) throw new CatalogOperationError("Cấu hình danh mục hiện tại không hợp lệ. Không có thay đổi nào được lưu; hãy liên hệ quản trị hệ thống.");
      for (const catalogKey of Object.keys(rawCatalog.data) as ProductCatalogKey[]) {
        const activeNames = new Set(rawCatalog.data[catalogKey].map((item) => String(item).toLocaleLowerCase("vi")));
        if (rawArchived.data[catalogKey].some((item) => activeNames.has(item.toLocaleLowerCase("vi")))) {
          throw new CatalogOperationError("Danh mục hiện tại đang có mục bị trùng giữa đang dùng và đã ngừng. Không có thay đổi nào được lưu.");
        }
      }
      const active = current.catalog[key] as Array<string | number>;
      const archived = current.catalogArchived[key];
      const activeIndex = active.findIndex((item) => equalValue(item, value));
      const archivedIndex = archived.findIndex((item) => equalValue(item, value));
      let oldValue: string | null = null;
      let newValue: string | null = null;

      if (action === "add") {
        if (activeIndex >= 0 || archivedIndex >= 0) throw new CatalogOperationError("Mục này đã có trong danh mục hoặc đã ngừng dùng. Hãy khôi phục mục cũ nếu cần.");
        active.push(key === "truckCapacitiesM3" ? Number(value) : value);
        newValue = value;
      } else if (action === "disable") {
        if (activeIndex < 0) throw new CatalogOperationError("Không tìm thấy mục đang sử dụng.");
        const nextActive = active.filter((_, index) => index !== activeIndex);
        const candidate = { ...current.catalog, [key]: nextActive };
        if (!productCatalogSchema.safeParse(candidate).success) throw new CatalogOperationError("Không thể ngừng mục cuối cùng đang dùng. Hãy thêm mục thay thế trước.");
        active.splice(activeIndex, 1);
        archived.push(String(value));
        oldValue = value;
      } else if (action === "restore") {
        if (archivedIndex < 0) throw new CatalogOperationError("Không tìm thấy mục đã ngừng dùng.");
        archived.splice(archivedIndex, 1);
        active.push(key === "truckCapacitiesM3" ? Number(value) : value);
        newValue = value;
      } else {
        if (archivedIndex < 0) throw new CatalogOperationError("Chỉ có thể xóa hẳn mục đã ngừng dùng.");
        const usedCondition = key === "truckCapacitiesM3"
          ? eq(orders.truckCapacityM3, value)
          : sql`lower(btrim(${orderFieldByCatalog[key]}::text)) = lower(btrim(${value}))`;
        const [usedOrder] = await tx.select({ id: orders.id }).from(orders).where(usedCondition).limit(1);
        if (usedOrder) throw new CatalogOperationError("Mục này đã xuất hiện trong đơn hàng, không thể xóa để bảo toàn lịch sử. Có thể tiếp tục để ở trạng thái ngừng dùng.");
        archived.splice(archivedIndex, 1);
        oldValue = value;
      }

      const validatedCatalog = productCatalogSchema.safeParse(current.catalog);
      if (!validatedCatalog.success) throw new CatalogOperationError(validatedCatalog.error.issues[0]?.message ?? "Danh mục không hợp lệ.");
      for (const catalogKey of Object.keys(current.catalog) as ProductCatalogKey[]) {
        const activeNames = new Set(current.catalog[catalogKey].map((item) => String(item).toLocaleLowerCase("vi")));
        if (current.catalogArchived[catalogKey].some((item) => activeNames.has(item.toLocaleLowerCase("vi")))) {
          throw new CatalogOperationError("Một mục không thể vừa đang dùng vừa ngừng dùng.");
        }
      }
      const next = { ...current, catalog: current.catalog, catalogArchived: current.catalogArchived };
      await tx.insert(appSettings).values({ id: "default", values: next, updatedBy: access.session.user.id })
        .onConflictDoUpdate({ target: appSettings.id, set: { values: next, updatedBy: access.session.user.id, updatedAt: new Date() } });
      await tx.insert(adminAuditEvents).values({
        actorUserId: access.session.user.id, eventType: `CATALOG_${action.toLocaleUpperCase("en-US")}`,
        entityType: "product_catalog", entityKey: key, oldValue, newValue,
      });
      return next;
    });
    return NextResponse.json({ ok: true, catalog: settings.catalog, catalogArchived: settings.catalogArchived });
  } catch (error) {
    if (error instanceof CatalogOperationError) return NextResponse.json({ error: error.message }, { status: 400 });
    logServerError("catalog_update_failed", error, request);
    return NextResponse.json({ error: "Không cập nhật được danh mục. Chưa có thay đổi nào được lưu." }, { status: 500 });
  }
}
