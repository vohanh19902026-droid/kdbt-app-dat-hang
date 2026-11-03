import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orderEvents, orders } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { canTransition, planningFields, validatePlanningState } from "@/lib/order-rules";
import { resolvePlanningTimes } from "@/lib/planning-schedule";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { isValidIsoDate, vnDateOf } from "@/lib/vn-date";
import type { OrderStatus } from "@/lib/types";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";
const patchSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
  plannedDate: z.string().refine(isValidIsoDate, "Ngày kế hoạch không hợp lệ (YYYY-MM-DD).").optional(),
  plannedStartTime: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")]).nullable().optional(),
  plannedEndTime: z.union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")]).nullable().optional(),
  quantityM3: z.coerce.number().positive().max(5000).optional(),
  actualM3: z.coerce.number().min(0).max(5000).optional(),
  grade: z.string().trim().min(1).max(80).optional(),
  sandType: z.string().trim().min(1).max(100).optional(),
  stoneType: z.string().trim().min(1).max(100).optional(),
  pumpRequired: z.string().trim().max(100).optional(),
  pumpOperator: z.string().trim().max(120).optional(),
  assignedVehicle: z.string().trim().max(120).optional(),
  truckCapacityM3: z.coerce.number().positive().max(30).optional(),
  pourType: z.string().trim().max(120).optional(),
  planningNote: z.string().trim().max(1000).optional(),
  contactName: z.string().trim().max(120).nullable().optional(),
  contactPhone: z.string().trim().max(30).nullable().optional(),
  salesNote: z.string().trim().max(1000).optional(),
  customerName: z.string().trim().min(2).max(180).optional(),
  siteAddress: z.string().trim().min(3).max(500).optional(),
  version: z.coerce.number().int().min(0).optional(),
});
const toIso = (value: Date | null | undefined) => (value ? value.toISOString() : null);

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (isCrossOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!["ADMIN", "PLANNER"].includes(session.appRole)) {
    return NextResponse.json({ error: "Chỉ nhân viên kế hoạch được cập nhật bảng điều phối." }, { status: 403 });
  }
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Mã booking không hợp lệ." }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu chưa hợp lệ." }, { status: 400 });
  const patch = parsed.data;
  const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!existing) return NextResponse.json({ error: "Không tìm thấy booking." }, { status: 404 });
  if (patch.version !== undefined && Number(existing.version) !== patch.version) {
    return NextResponse.json({ error: "Đơn vừa được người khác cập nhật. Tải lại bảng rồi thử lại." }, { status: 409 });
  }

  const times = resolvePlanningTimes(
    { requestedAt: existing.requestedAt, plannedStartAt: existing.plannedStartAt, plannedEndAt: existing.plannedEndAt },
    { plannedDate: patch.plannedDate, plannedStartTime: patch.plannedStartTime, plannedEndTime: patch.plannedEndTime },
  );
  if (!times.ok) return NextResponse.json({ error: times.error }, { status: 400 });

  const nextStatus = patch.status ?? existing.status;
  const nextVehicle = patch.assignedVehicle ?? existing.assignedVehicle;
  const planningError = validatePlanningState({
    status: nextStatus as OrderStatus, plannedStartAt: times.startAt, plannedEndAt: times.endAt,
    assignedVehicle: nextVehicle,
  });
  if (planningError) return NextResponse.json({ error: planningError }, { status: 400 });
  if (patch.status && !canTransition(existing.status as OrderStatus, patch.status)) {
    return NextResponse.json({ error: `Không thể chuyển từ ${existing.status} sang ${patch.status}.` }, { status: 409 });
  }

  const values: Partial<typeof orders.$inferInsert> = { updatedAt: new Date(), version: String(Number(existing.version) + 1) };
  const events: { eventType: string; fieldName: string | null; oldValue: string | null; newValue: string | null }[] = [];

  if (patch.plannedDate !== undefined) {
    const oldDate = existing.plannedStartAt
      ? vnDateOf(existing.plannedStartAt)
      : existing.plannedEndAt ? vnDateOf(existing.plannedEndAt) : null;
    events.push({ eventType: "ORDER_UPDATED", fieldName: "plannedDate", oldValue: oldDate, newValue: patch.plannedDate });
  }
  if (toIso(times.startAt) !== toIso(existing.plannedStartAt)) {
    values.plannedStartAt = times.startAt;
    events.push({
      eventType: "ORDER_UPDATED", fieldName: "plannedStartAt",
      oldValue: toIso(existing.plannedStartAt), newValue: toIso(times.startAt),
    });
  }
  if (toIso(times.endAt) !== toIso(existing.plannedEndAt)) {
    values.plannedEndAt = times.endAt;
    events.push({
      eventType: "ORDER_UPDATED", fieldName: "plannedEndAt",
      oldValue: toIso(existing.plannedEndAt), newValue: toIso(times.endAt),
    });
  }

  for (const field of planningFields) {
    if (field === "plannedStartAt" || field === "plannedEndAt") continue;
    const value = patch[field as keyof typeof patch];
    if (value === undefined) continue;
    let next: unknown = value;
    const old: unknown = existing[field as keyof typeof existing];
    if (field === "quantityM3") { next = String(value); values.quantityM3 = next as string; }
    else if (field === "actualM3") { next = String(value); values.actualM3 = next as string; }
    else if (field === "contactName") { next = value === "" ? null : value; values.contactName = next as string | null; }
    else if (field === "contactPhone") { next = value === "" ? null : value; values.contactPhone = next as string | null; }
    else values[field] = value as never;
    events.push({ eventType: "ORDER_UPDATED", fieldName: field, oldValue: old == null ? null : String(old), newValue: next == null ? null : String(next) });
  }
  for (const field of ["customerName", "siteAddress", "salesNote"] as const) {
    const value = patch[field];
    if (value === undefined) continue;
    const old = existing[field]; values[field] = value as never;
    events.push({ eventType: "ORDER_UPDATED", fieldName: field, oldValue: old ?? null, newValue: value });
  }
  if (patch.status) {
    values.status = patch.status;
    if (patch.status === "APPROVED") { values.approvedBy = session.user.id; values.approvedAt = new Date(); }
    events.push({ eventType: patch.status, fieldName: "status", oldValue: existing.status, newValue: patch.status });
  }
  if (events.length === 0) return NextResponse.json({ error: "Không có trường nào được thay đổi." }, { status: 400 });
  try {
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(orders).set(values)
        .where(and(eq(orders.id, id), eq(orders.version, existing.version))).returning();
      if (!row) throw new Error("CONCURRENT_UPDATE");
      await tx.insert(orderEvents).values(events.map((event) => ({ ...event, orderId: id, actorUserId: session.user.id })));
      return row;
    });
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "CONCURRENT_UPDATE") {
      return NextResponse.json({ error: "Đơn vừa được người khác cập nhật. Tải lại bảng rồi thử lại." }, { status: 409 });
    }
    logServerError("update_order_failed", error, request);
    return NextResponse.json({ error: "Không cập nhật được booking." }, { status: 500 });
  }
}
