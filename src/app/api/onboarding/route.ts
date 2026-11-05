import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isCrossOriginRequest } from "@/lib/request-guard";

export const runtime = "nodejs";
const profileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  department: z.string().trim().min(2).max(80),
  jobTitle: z.string().trim().min(2).max(80),
  age: z.coerce.number().int().min(16).max(100),
  requestedAppRole: z.enum(["ADMIN", "PLANNER", "SALES", "ACCOUNTANT", "TECHNICAL"]),
});

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập lại." }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Vui lòng nhập đủ họ tên, bộ phận, chức vụ và vai trò." }, { status: 400 });
  const [account] = await db.select({ isActive: user.isActive }).from(user).where(eq(user.id, session.user.id)).limit(1);
  if (!account) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  if (account.isActive) return NextResponse.json({ error: "Tài khoản đã được kích hoạt." }, { status: 409 });
  await db.update(user).set({
    name: parsed.data.name,
    department: parsed.data.department,
    jobTitle: parsed.data.jobTitle,
    age: parsed.data.age,
    requestedAppRole: parsed.data.requestedAppRole,
    updatedAt: new Date(),
  }).where(eq(user.id, session.user.id));
  return NextResponse.json({ ok: true });
}
