import { and, asc, eq } from "drizzle-orm";
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
  name: z.string().trim().min(2).max(100), email: z.email().max(254),
  password: z.string().min(10).max(128), appRole: z.enum(["ADMIN", "PLANNER", "SALES", "ACCOUNTANT", "TECHNICAL"]),
  employeeCode: z.string().trim().max(40).optional(), phone: z.string().trim().max(30).optional(),
  department: z.string().trim().max(80).optional(), monthlyTargetM3: z.coerce.number().min(0).max(1000000).optional(),
});
async function adminSession(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return { error: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  if (session.appRole !== "ADMIN") return { error: NextResponse.json({ error: "Chỉ Admin được quản lý tài khoản." }, { status: 403 }) };
  return { session };
}

export async function GET(request: NextRequest) {
  const access = await adminSession(request);
  if ("error" in access) return access.error;
  const rows = await db.select({
    id: user.id, name: user.name, email: user.email, appRole: user.appRole,
    isActive: user.isActive, createdAt: user.createdAt, employeeCode: user.employeeCode,
    phone: user.phone, department: user.department, monthlyTargetM3: user.monthlyTargetM3,
  }).from(user).orderBy(asc(user.name));
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const access = await adminSession(request);
  if ("error" in access) return access.error;
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Thông tin chưa hợp lệ." }, { status: 400 });
  const data = parsed.data;
  const initialPassword = data.password;
  try {
    const created = await auth.api.createUser({
      body: { name: data.name, email: data.email, password: initialPassword, role: data.appRole === "ADMIN" ? "admin" : "user" },
      headers: request.headers,
    });
    await db.update(user).set({ appRole: data.appRole, isActive: true, employeeCode: data.employeeCode || null,
      phone: data.phone || null, department: data.department || null,
      monthlyTargetM3: data.monthlyTargetM3 === undefined ? null : String(data.monthlyTargetM3), updatedAt: new Date() }).where(eq(user.id, created.user.id));
    return NextResponse.json({ id: created.user.id, name: data.name, email: data.email, appRole: data.appRole }, { status: 201 });
  } catch (error) {
    logServerError("admin_create_user_failed", error, request);
    return NextResponse.json({ error: "Không tạo được tài khoản. Email có thể đã tồn tại." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const access = await adminSession(request);
  if ("error" in access) return access.error;
  const parsed = z.object({
    userId: z.string().min(1), appRole: z.enum(["ADMIN", "PLANNER", "SALES", "ACCOUNTANT", "TECHNICAL"]).optional(), isActive: z.boolean().optional(),
    employeeCode: z.string().trim().max(40).nullable().optional(), phone: z.string().trim().max(30).nullable().optional(),
    department: z.string().trim().max(80).nullable().optional(), monthlyTargetM3: z.coerce.number().min(0).max(1000000).nullable().optional(),
  }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Dữ liệu cập nhật chưa hợp lệ." }, { status: 400 });
  const data = parsed.data;
  if (data.userId === access.session.user.id && data.isActive === false) {
    return NextResponse.json({ error: "Không thể khóa tài khoản đang đăng nhập." }, { status: 400 });
  }
  const [target] = await db.select({ appRole: user.appRole, isActive: user.isActive }).from(user).where(eq(user.id, data.userId)).limit(1);
  if (!target) return NextResponse.json({ error: "Không tìm thấy tài khoản." }, { status: 404 });
  const removingAdmin = target.appRole === "ADMIN" && target.isActive && (data.appRole && data.appRole !== "ADMIN" || data.isActive === false);
  if (removingAdmin) {
    const admins = await db.select({ id: user.id }).from(user).where(and(eq(user.appRole, "ADMIN"), eq(user.isActive, true)));
    const activeAdminCount = admins.length;
    if (activeAdminCount <= 1) return NextResponse.json({ error: "Cần giữ lại ít nhất một tài khoản Admin." }, { status: 400 });
  }
  if (data.isActive !== undefined && data.isActive !== target.isActive) {
    try {
      await auth.api.revokeUserSessions({ body: { userId: data.userId }, headers: request.headers });
    } catch (error) {
      logServerError("admin_user_sessions_revoke_failed", error, request);
      return NextResponse.json({ error: "Không thể thu hồi phiên đăng nhập. Trạng thái tài khoản chưa đổi." }, { status: 503 });
    }
  }
  const patch = {
    ...(data.appRole ? { appRole: data.appRole, role: data.appRole === "ADMIN" ? "admin" : "user" } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    ...(data.employeeCode !== undefined ? { employeeCode: data.employeeCode || null } : {}),
    ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
    ...(data.department !== undefined ? { department: data.department || null } : {}),
    ...(data.monthlyTargetM3 !== undefined ? { monthlyTargetM3: data.monthlyTargetM3 === null ? null : String(data.monthlyTargetM3) } : {}),
  };
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Không có trường nào cần cập nhật." }, { status: 400 });
  await db.update(user).set({ ...patch, updatedAt: new Date() }).where(eq(user.id, data.userId));
  return NextResponse.json({ ok: true });
}
