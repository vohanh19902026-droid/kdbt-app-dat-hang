import { and, count, eq, gte, isNull, lt } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { account, coldRecoveryChallenges, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isCrossOriginRequest } from "@/lib/request-guard";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user.emailVerified) return NextResponse.json({ error: "Hãy xác thực email Google trước." }, { status: 401 });
  if (!process.env.BETTER_AUTH_SECRET || process.env.BETTER_AUTH_SECRET.length < 32) {
    return NextResponse.json({ error: "Cơ chế khôi phục chủ sở hữu chưa được cấu hình." }, { status: 503 });
  }
  const [googleAccount] = await db.select({ id: account.id }).from(account)
    .where(and(eq(account.userId, session.user.id), eq(account.providerId, "google"))).limit(1);
  if (!googleAccount) return NextResponse.json({ error: "Khôi phục chủ sở hữu yêu cầu tài khoản Google đã liên kết." }, { status: 403 });

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60_000);
  const challenge = await db.transaction(async (tx) => {
    const [owner] = await tx.select({ id: user.id }).from(user).where(eq(user.id, session.user.id)).for("update").limit(1);
    if (!owner) return null;
    const [recent] = await tx.select({ total: count() }).from(coldRecoveryChallenges)
      .where(and(eq(coldRecoveryChallenges.userId, session.user.id), gte(coldRecoveryChallenges.createdAt, new Date(now.getTime() - 60 * 60_000))));
    if (recent.total >= 3) return null;
    await tx.delete(coldRecoveryChallenges).where(lt(coldRecoveryChallenges.createdAt, new Date(now.getTime() - 30 * 24 * 60 * 60_000)));
    await tx.update(coldRecoveryChallenges).set({ usedAt: now })
      .where(and(eq(coldRecoveryChallenges.userId, session.user.id), isNull(coldRecoveryChallenges.usedAt)));
    const [created] = await tx.insert(coldRecoveryChallenges).values({ userId: session.user.id, expiresAt }).returning({ id: coldRecoveryChallenges.id });
    return created;
  });
  if (!challenge) return NextResponse.json({ error: "Đã đạt giới hạn 3 thử thách mỗi giờ. Hãy chờ rồi thử lại." }, { status: 429 });
  return NextResponse.json({ challengeId: challenge.id, expiresAt: expiresAt.toISOString() });
}
