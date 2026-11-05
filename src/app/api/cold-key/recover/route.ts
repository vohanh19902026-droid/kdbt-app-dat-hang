import { and, eq, isNull } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { account, adminAuditEvents, coldRecoveryChallenges, session as authSession, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { createColdKeyCode, verifyColdKeyCode } from "@/lib/cold-key";
import { isCrossOriginRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
const inputSchema = z.object({ challengeId: z.uuid(), code: z.string().regex(/^\d{10}$/) });
const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.emailVerified) return NextResponse.json({ error: "Phiên xác thực đã hết hạn. Hãy đăng nhập Google lại." }, { status: 401 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Mã khôi phục chưa đúng định dạng." }, { status: 400 });
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!secret || secret.length < 32) return NextResponse.json({ error: "Cơ chế khôi phục chủ sở hữu chưa được cấu hình." }, { status: 503 });
  const [googleAccount] = await db.select({ id: account.id }).from(account)
    .where(and(eq(account.userId, session.user.id), eq(account.providerId, "google"))).limit(1);
  if (!googleAccount) return NextResponse.json({ error: "Tài khoản Google chưa được liên kết." }, { status: 403 });

  const result = await db.transaction(async (tx) => {
    const [challenge] = await tx.select().from(coldRecoveryChallenges)
      .where(and(eq(coldRecoveryChallenges.id, parsed.data.challengeId), eq(coldRecoveryChallenges.userId, session.user.id)))
      .for("update").limit(1);
    const now = new Date();
    if (!challenge || challenge.usedAt || challenge.expiresAt <= now || challenge.attempts >= MAX_ATTEMPTS) return "invalid" as const;
    const expected = createColdKeyCode(secret, challenge.id);
    if (!verifyColdKeyCode(expected, parsed.data.code)) {
      const attempts = challenge.attempts + 1;
      await tx.update(coldRecoveryChallenges).set({ attempts, ...(attempts >= MAX_ATTEMPTS ? { usedAt: now } : {}) })
        .where(eq(coldRecoveryChallenges.id, challenge.id));
      return "invalid" as const;
    }
    const [target] = await tx.select({ appRole: user.appRole, isActive: user.isActive }).from(user)
      .where(eq(user.id, session.user.id)).for("update").limit(1);
    if (!target) return "invalid" as const;
    await tx.update(coldRecoveryChallenges).set({ usedAt: now }).where(eq(coldRecoveryChallenges.id, challenge.id));
    await tx.update(user).set({ appRole: "ADMIN", role: "admin", isActive: true, requestedAppRole: null, updatedAt: now })
      .where(eq(user.id, session.user.id));
    await tx.insert(adminAuditEvents).values({ actorUserId: session.user.id, eventType: "COLD_KEY_ADMIN_RECOVERY",
      entityType: "user", entityKey: session.user.id,
      oldValue: `appRole=${target.appRole};isActive=${target.isActive}`,
      newValue: "appRole=ADMIN;isActive=true;all_sessions_revoked=true" });
    await tx.delete(authSession).where(eq(authSession.userId, session.user.id));
    return "recovered" as const;
  });
  if (result !== "recovered") return NextResponse.json({ error: "Mã không hợp lệ, đã hết hạn hoặc đã dùng. Hãy tạo thử thách mới." }, { status: 400 });
  return NextResponse.json({ ok: true, message: "Đã khôi phục quyền Admin. Tất cả phiên cũ đã bị thu hồi; hãy đăng nhập Google lại." });
}
