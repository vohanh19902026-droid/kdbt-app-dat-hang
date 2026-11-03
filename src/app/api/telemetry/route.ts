import { NextResponse } from "next/server";
import { db } from "@/db";
import { usageEvents } from "@/db/schema";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { getApiSession } from "@/lib/session";

export const runtime = "nodejs";

const allowedRoutes = new Set(["/orders", "/receiving", "/planning", "/reports", "/customers", "/accounting", "/admin/settings", "/technical/catalog", "/notifications"]);

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || isCrossOriginRequest(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 1024) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null) as { route?: unknown; transferBytes?: unknown } | null;
  const route = typeof body?.route === "string" ? body.route : "";
  const bytes = typeof body?.transferBytes === "number" && Number.isFinite(body.transferBytes) ? Math.min(50_000_000, Math.max(0, Math.round(body.transferBytes))) : 0;
  if (!allowedRoutes.has(route)) return NextResponse.json({ error: "Invalid route" }, { status: 400 });

  await db.insert(usageEvents).values({ userId: session.user.id, route, transferBytes: String(bytes) });
  return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
