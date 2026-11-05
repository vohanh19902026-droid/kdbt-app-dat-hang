import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { logServerError } from "@/lib/server-logger";

export const runtime = "nodejs";

const inputSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(10).max(128),
});

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.appRole !== "ADMIN") return NextResponse.json({ error: "Chỉ Admin được đặt lại mật khẩu." }, { status: 403 });

  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ." }, { status: 400 });
  if (parsed.data.userId === session.user.id) {
    return NextResponse.json({ error: "Hãy dùng chức năng đổi mật khẩu trong menu tài khoản của chính bạn." }, { status: 400 });
  }

  const [target] = await db.select({ id: user.id, appRole: user.appRole, isPlatformOwner: user.isPlatformOwner }).from(user).where(eq(user.id, parsed.data.userId)).limit(1);
  if (!target) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  if (target.isPlatformOwner) return NextResponse.json({ error: "Mật khẩu SUP-ADMIN chỉ được khôi phục bằng email đã xác minh hoặc Google." }, { status: 403 });
  if (target.appRole === "ADMIN" && !session.isPlatformOwner) return NextResponse.json({ error: "Chỉ SUP-ADMIN được đặt lại mật khẩu của Admin." }, { status: 403 });

  try {
    await auth.api.revokeUserSessions({ body: { userId: target.id }, headers: request.headers });
    await auth.api.setUserPassword({
      body: { userId: target.id, newPassword: parsed.data.newPassword },
      headers: request.headers,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    logServerError("admin_user_password_reset_failed", error, request);
    return NextResponse.json({ error: "Không thể đặt lại mật khẩu. Vui lòng thử lại." }, { status: 503 });
  }
}
