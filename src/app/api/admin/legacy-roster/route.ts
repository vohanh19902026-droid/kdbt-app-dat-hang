import { and, asc, eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { adminAuditEvents, legacySalesRoster, legacySalesRosterEvidence, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

async function adminAccess(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return { error: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  if (session.appRole !== "ADMIN") return { error: NextResponse.json({ error: "Chỉ Admin được đối chiếu roster NVKD." }, { status: 403 }) };
  return { session };
}

export async function GET(request: NextRequest) {
  const access = await adminAccess(request);
  if ("error" in access) return access.error;
  try {
    const [roster, salesUsers] = await Promise.all([
      db.select({
        id: legacySalesRoster.id,
        segment: legacySalesRoster.segment,
        displayName: legacySalesRoster.displayName,
        observedMonths: legacySalesRoster.observedMonths,
        reviewStatus: legacySalesRoster.reviewStatus,
        mappedUserId: legacySalesRoster.mappedUserId,
        mappedUserName: user.name,
        mappedUserEmail: user.email,
        evidenceCount: sql<number>`count(${legacySalesRosterEvidence.id})::int`,
      }).from(legacySalesRoster)
        .leftJoin(user, eq(legacySalesRoster.mappedUserId, user.id))
        .leftJoin(legacySalesRosterEvidence, eq(legacySalesRosterEvidence.rosterId, legacySalesRoster.id))
        .groupBy(legacySalesRoster.id, user.id)
        .orderBy(asc(legacySalesRoster.segment), asc(legacySalesRoster.displayName)),
      db.select({ id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified, isActive: user.isActive })
        .from(user).where(and(eq(user.appRole, "SALES"), eq(user.isActive, true), eq(user.emailVerified, true))).orderBy(asc(user.name)),
    ]);
    return NextResponse.json({ roster, salesUsers }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    logServerError("legacy_sales_roster_list_failed", error, request);
    return NextResponse.json({ error: "Chưa có roster nhập vào database hoặc không tải được dữ liệu." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const access = await adminAccess(request);
  if ("error" in access) return access.error;
  const parsed = z.object({
    rosterId: z.string().min(1).max(80),
    reviewStatus: z.enum(["NEEDS_EMPLOYER_CONFIRMATION", "CONFIRMED_CURRENT", "NOT_CURRENT", "DUPLICATE"]),
    userId: z.string().min(1).max(128).nullable(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Thông tin đối chiếu chưa hợp lệ." }, { status: 400 });
  const { rosterId, reviewStatus, userId } = parsed.data;
  if (reviewStatus === "CONFIRMED_CURRENT" && !userId) {
    return NextResponse.json({ error: "Chỉ xác nhận NVKD hiện hành sau khi ghép với tài khoản đã xác minh và đang hoạt động." }, { status: 400 });
  }
  if (reviewStatus !== "CONFIRMED_CURRENT" && userId) {
    return NextResponse.json({ error: "Chỉ roster đã xác nhận hiện hành mới được ghép tài khoản." }, { status: 400 });
  }
  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select({ id: legacySalesRoster.id, reviewStatus: legacySalesRoster.reviewStatus, mappedUserId: legacySalesRoster.mappedUserId })
        .from(legacySalesRoster).where(eq(legacySalesRoster.id, rosterId)).for("update").limit(1);
      if (!current) return { status: 404 as const };
      if (reviewStatus === "CONFIRMED_CURRENT" && userId) {
        const [target] = await tx.select({ id: user.id }).from(user).where(and(
          eq(user.id, userId), eq(user.appRole, "SALES"), eq(user.isActive, true), eq(user.emailVerified, true),
        )).for("update").limit(1);
        if (!target) return { status: 400 as const };
      }
      await tx.update(legacySalesRoster).set({
        reviewStatus,
        mappedUserId: reviewStatus === "CONFIRMED_CURRENT" ? userId : null,
        reviewedBy: access.session.user.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(legacySalesRoster.id, rosterId));
      await tx.insert(adminAuditEvents).values({
        actorUserId: access.session.user.id,
        eventType: "LEGACY_SALES_ROSTER_REVIEW",
        entityType: "legacy_sales_roster",
        entityKey: rosterId,
        oldValue: `${current.reviewStatus}:${current.mappedUserId ?? ""}`,
        newValue: `${reviewStatus}:${reviewStatus === "CONFIRMED_CURRENT" ? userId : ""}`,
      });
      return { status: 200 as const };
    });
    if (result.status === 404) return NextResponse.json({ error: "Không tìm thấy dòng roster." }, { status: 404 });
    if (result.status === 400) return NextResponse.json({ error: "Tài khoản phải là NVKD đã xác minh email và đang hoạt động." }, { status: 400 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerError("legacy_sales_roster_review_failed", error, request);
    return NextResponse.json({ error: "Không lưu được kết quả đối chiếu NVKD." }, { status: 500 });
  }
}
