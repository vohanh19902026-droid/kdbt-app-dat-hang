import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { account, adminAuditEvents, user } from "@/db/schema";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { canBootstrapPlatformOwner } from "@/lib/platform-owner-bootstrap-policy";
import { isCrossOriginRequest } from "@/lib/request-guard";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (process.env.VERCEL_ENV !== "preview") {
    return NextResponse.json({ error: "Thiết lập chủ sở hữu chỉ mở trên Preview." }, { status: 404 });
  }
  if (isCrossOriginRequest(request)) {
    return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  }

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập Google trước." }, { status: 401 });

  const result = await db.transaction(async (tx) => {
    const [candidate] = await tx.select({
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
      isPlatformOwner: user.isPlatformOwner,
    }).from(user).where(eq(user.id, session.user.id)).for("update").limit(1);
    if (!candidate) return { status: 404, error: "Không tìm thấy tài khoản." };

    const [googleAccount] = await tx.select({ id: account.id }).from(account).where(and(
      eq(account.userId, candidate.id),
      eq(account.providerId, "google"),
    )).limit(1);
    const [existingOwner] = await tx.select({ id: user.id }).from(user)
      .where(eq(user.isPlatformOwner, true)).for("update").limit(1);

    if (!canBootstrapPlatformOwner({
      vercelEnvironment: process.env.VERCEL_ENV,
      userId: candidate.id,
      email: candidate.email,
      emailVerified: candidate.emailVerified,
      googleAccountLinked: Boolean(googleAccount),
      existingOwnerId: existingOwner?.id ?? null,
    })) {
      return { status: existingOwner && existingOwner.id !== candidate.id ? 409 : 403,
        error: existingOwner && existingOwner.id !== candidate.id
          ? "Chủ sở hữu nền tảng đã được thiết lập."
          : "Chỉ chủ tài khoản Google đã xác minh được cấu hình mới có thể hoàn tất bước này." };
    }

    if (candidate.isPlatformOwner) return { status: 200 as const, ok: true as const };

    await tx.update(user).set({
      appRole: "ADMIN",
      role: "admin",
      isActive: true,
      isPlatformOwner: true,
      requestedAppRole: null,
      updatedAt: new Date(),
    }).where(eq(user.id, candidate.id));
    await tx.insert(adminAuditEvents).values({
      actorUserId: candidate.id,
      eventType: "platform_owner_bootstrap",
      entityType: "user",
      entityKey: candidate.id,
      oldValue: "pending_owner",
      newValue: "SUP-ADMIN",
    });
    return { status: 200 as const, ok: true as const };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true, redirectTo: "/orders" });
}
