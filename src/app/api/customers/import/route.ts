import { and, eq, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { customers, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { normalizeCustomerDuplicateKey } from "@/lib/customer-workbook";

export const runtime = "nodejs";

const importSchema = z.object({ customers: z.array(z.object({
  rowNumber: z.number().int().min(2).max(10000),
  name: z.string().trim().min(2).max(180),
  phone: z.string().trim().max(40).nullable(),
  defaultAddress: z.string().trim().max(500).nullable(),
  salesRepId: z.string().uuid(),
}).strict()).min(1).max(200) }).strict();

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.appRole !== "ADMIN") return NextResponse.json({ error: "Chỉ Admin được nhập danh sách khách hàng." }, { status: 403 });
  const parsed = importSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu nhập chưa hợp lệ." }, { status: 400 });

  const input = parsed.data.customers;
  const repIds = [...new Set(input.map((customer) => customer.salesRepId))];
  const activeReps = await db.select({ id: user.id }).from(user).where(and(
    inArray(user.id, repIds), eq(user.appRole, "SALES"), eq(user.isActive, true),
  ));
  const activeRepIds = new Set(activeReps.map((rep) => rep.id));
  if (activeRepIds.size !== repIds.length) {
    return NextResponse.json({ error: "Có NVKD không tồn tại, đã khóa hoặc không đúng vai trò. Hãy kiểm tra email/mã NVKD trong tệp." }, { status: 400 });
  }

  const requestKeys = new Set<string>();
  const duplicateRows: number[] = [];
  for (const customer of input) {
    const key = normalizeCustomerDuplicateKey(customer);
    if (requestKeys.has(key)) duplicateRows.push(customer.rowNumber);
    requestKeys.add(key);
  }
  if (duplicateRows.length) {
    return NextResponse.json({ error: `Tệp có khách hàng trùng ở dòng ${duplicateRows.join(", ")}.`, duplicateRows }, { status: 409 });
  }

  const existing = await db.select({ name: customers.name, phone: customers.phone, defaultAddress: customers.defaultAddress }).from(customers);
  const existingKeys = new Set(existing.map(normalizeCustomerDuplicateKey));
  const existingDuplicates = input.filter((customer) => existingKeys.has(normalizeCustomerDuplicateKey(customer)));
  if (existingDuplicates.length) {
    const duplicateNames = existingDuplicates.map((customer) => `dòng ${customer.rowNumber} (${customer.name})`);
    return NextResponse.json({ error: `Một số khách hàng đã tồn tại: ${duplicateNames.join(", ")}. Hãy bỏ các dòng này hoặc sửa hồ sơ hiện có.`, duplicateRows: existingDuplicates.map((customer) => customer.rowNumber) }, { status: 409 });
  }

  const inserted = await db.insert(customers).values(input.map((customer) => ({
    name: customer.name, phone: customer.phone || null, defaultAddress: customer.defaultAddress || null,
    salesRepId: customer.salesRepId, isActive: true,
  }))).returning({ id: customers.id });
  return NextResponse.json({ imported: inserted.length });
}
