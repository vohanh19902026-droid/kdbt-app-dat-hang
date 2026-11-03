import { NextResponse } from "next/server";
import { count, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders, usageEvents, user } from "@/db/schema";
import { getApiSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getApiSession(request.headers);
  if (!session || session.appRole !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const range = new URL(request.url).searchParams.get("range");
  const hours = range === "24h" ? 24 : range === "7d" ? 168 : 720;
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const checkDatabase = async () => {
    const startedAt = Date.now();
    await db.execute(sql`select 1`);
    return Date.now() - startedAt;
  };
  const [health, traffic, active, users, orderCount, byRoute] = await Promise.all([
    checkDatabase(),
    db.select({ pageViews: count(), bytes: sql<string>`COALESCE(SUM(${usageEvents.transferBytes}), 0)::text`, uniqueUsers: sql<number>`COUNT(DISTINCT ${usageEvents.userId})::int` })
      .from(usageEvents).where(gte(usageEvents.createdAt, since)),
    db.select({ users: sql<number>`COUNT(DISTINCT ${usageEvents.userId})::int` }).from(usageEvents)
      .where(gte(usageEvents.createdAt, new Date(Date.now() - 5 * 60_000))),
    db.select({ total: count(), active: sql<number>`COUNT(*) FILTER (WHERE ${user.isActive})::int` }).from(user),
    db.select({ total: count() }).from(orders),
    db.select({ route: usageEvents.route, visits: count(), bytes: sql<string>`COALESCE(SUM(${usageEvents.transferBytes}), 0)::text` })
      .from(usageEvents).where(gte(usageEvents.createdAt, since)).groupBy(usageEvents.route).orderBy(sql`count(*) DESC`),
  ]);
  const dbLatencyMs = health;
  const bytes = Number(traffic[0]?.bytes || 0);
  return NextResponse.json({
    range: `${hours}h`, collectedSince: since.toISOString(), pageViews: traffic[0]?.pageViews ?? 0,
    uniqueUsers: traffic[0]?.uniqueUsers ?? 0, activeUsersNow: active[0]?.users ?? 0,
    observedTransferBytes: bytes,
    database: { status: "up", latencyMs: dbLatencyMs, provider: process.env.VERCEL === "1" ? "Neon PostgreSQL" : "PostgreSQL" },
    byRoute: byRoute.map((item) => ({ route: item.route, visits: item.visits, bytes: Number(item.bytes) })),
    accounts: users[0] ?? { total: 0, active: 0 }, totalOrders: orderCount[0]?.total ?? 0,
    deployment: process.env.VERCEL_ENV ?? "local", region: process.env.VERCEL_REGION ?? "—",
    runtime: `Node.js ${process.versions.node}`, appVersion: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? process.env.npm_package_version ?? "local",
  }, { headers: { "Cache-Control": "no-store" } });
}
