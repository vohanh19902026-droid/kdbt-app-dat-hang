import { and, asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customers, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";

export const runtime = "nodejs";

async function managerAccess(request: NextRequest, adminOnly = false) {
  const session = await getApiSession(request.headers);
  if (!session) return { error: NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  if (adminOnly ? session.appRole !== "ADMIN" : !["ADMIN", "PLANNER"].includes(session.appRole)) {
    return { error: NextResponse.json({ error: adminOnly ? "Chỉ Admin được quản lý khách hàng." : "Bạn không có quyền xem danh mục khách hàng." }, { status: 403 }) };
  }
  return { session };
}

const customerFields = {
  name: z.string().trim().min(2).max(180),
  phone: z.string().trim().max(40).nullable().optional(),
  defaultAddress: z.string().trim().max(500).nullable().optional(),
  salesRepId: z.string().trim().min(1).nullable().optional(),
};

async function validateSalesRep(salesRepId: string | null | undefined, currentCustomerId?: string) {
  if (salesRepId === undefined || salesRepId === null) return true;
  const [salesRep] = await db.select({ id: user.id, isActive: user.isActive }).from(user)
    .where(and(eq(user.id, salesRepId), eq(user.appRole, "SALES"))).limit(1);
  if (!salesRep) return false;
  if (salesRep.isActive) return true;
  if (!currentCustomerId) return false;
  const [current] = await db.select({ id: customers.id }).from(customers)
    .where(and(eq(customers.id, currentCustomerId), eq(customers.salesRepId, salesRepId))).limit(1);
  return Boolean(current);
}

export async function GET(request: NextRequest) {
  const access = await managerAccess(request);
  if ("error" in access) return access.error;
  const [rows, salesUsers] = await Promise.all([
    db.select({ id: customers.id, name: customers.name, phone: customers.phone, defaultAddress: customers.defaultAddress,
      salesRepId: customers.salesRepId, isActive: customers.isActive, createdAt: customers.createdAt,
      salesRepName: user.name })
      .from(customers).leftJoin(user, eq(customers.salesRepId, user.id)).orderBy(asc(customers.name), asc(customers.id)),
    access.session.appRole === "ADMIN"
      ? db.select({ id: user.id, name: user.name, employeeCode: user.employeeCode }).from(user)
        .where(and(eq(user.appRole, "SALES"), eq(user.isActive, true))).orderBy(asc(user.name))
      : Promise.resolve([]),
  ]);
  return NextResponse.json({ customers: rows, salesUsers });
}

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const access = await managerAccess(request, true);
  if ("error" in access) return access.error;
  const parsed = z.object(customerFields).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Thông tin khách hàng chưa hợp lệ." }, { status: 400 });
  const data = parsed.data;
  if (!(await validateSalesRep(data.salesRepId))) return NextResponse.json({ error: "NVKD được giao không tồn tại, đã khóa hoặc không đúng vai trò." }, { status: 400 });
  const [created] = await db.insert(customers).values({ name: data.name, phone: data.phone || null,
    defaultAddress: data.defaultAddress || null, salesRepId: data.salesRepId || null, isActive: true }).returning({ id: customers.id });
  return NextResponse.json({ id: created.id }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const access = await managerAccess(request, true);
  if ("error" in access) return access.error;
  const parsed = z.object({ customerId: z.string().uuid(), name: customerFields.name.optional(),
    phone: customerFields.phone, defaultAddress: customerFields.defaultAddress,
    salesRepId: customerFields.salesRepId, isActive: z.boolean().optional() })
    .refine((data) => Object.keys(data).some((key) => key !== "customerId"), "Không có trường nào cần cập nhật.")
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu cập nhật chưa hợp lệ." }, { status: 400 });
  const { customerId, ...data } = parsed.data;
  if (data.salesRepId !== undefined && !(await validateSalesRep(data.salesRepId, customerId))) {
    return NextResponse.json({ error: "NVKD được giao không tồn tại, đã khóa hoặc không đúng vai trò." }, { status: 400 });
  }
  const patch = {
    ...(data.name !== undefined ? { name: data.name } : {}),
    ...(data.phone !== undefined ? { phone: data.phone || null } : {}),
    ...(data.defaultAddress !== undefined ? { defaultAddress: data.defaultAddress || null } : {}),
    ...(data.salesRepId !== undefined ? { salesRepId: data.salesRepId || null } : {}),
    ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    updatedAt: new Date(),
  };
  const [updated] = await db.update(customers).set(patch).where(eq(customers.id, customerId)).returning({ id: customers.id });
  if (!updated) return NextResponse.json({ error: "Không tìm thấy khách hàng." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
