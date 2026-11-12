import { and, asc, eq, ilike, isNull, or } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { getApiSession } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  if (!["ADMIN", "PLANNER", "SALES"].includes(session.appRole)) {
    return NextResponse.json({ error: "You cannot search customers." }, { status: 403 });
  }
  const query = (request.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  if (query.length < 2) return NextResponse.json({ customers: [] }, { headers: { "Cache-Control": "no-store" } });
  const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
  const scope = [eq(customers.isActive, true)];
  if (session.appRole === "SALES") scope.push(or(eq(customers.salesRepId, session.user.id), isNull(customers.salesRepId))!);
  const rows = await db.select({
    id: customers.id, name: customers.name, phone: customers.phone, address: customers.defaultAddress,
  }).from(customers).where(and(
    ...scope,
    or(ilike(customers.name, pattern), ilike(customers.phone, pattern), ilike(customers.defaultAddress, pattern)),
  )).orderBy(asc(customers.name), asc(customers.id)).limit(30);
  return NextResponse.json({ customers: rows }, { headers: { "Cache-Control": "no-store" } });
}
