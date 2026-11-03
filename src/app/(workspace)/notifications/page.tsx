import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { appNotifications, orders } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { NotificationsInbox } from "@/components/notifications-inbox";
import { NotificationSettings } from "@/components/notification-settings";

export const runtime = "nodejs";

export default async function NotificationsPage() {
  const { appRole, user: currentUser } = await requireSession();
  const rows = await db.select({
    id: appNotifications.id, title: appNotifications.title, body: appNotifications.body,
    createdAt: appNotifications.createdAt, readAt: appNotifications.readAt,
    bookingNo: orders.bookingNo, requestedAt: orders.requestedAt, plannedStartAt: orders.plannedStartAt,
  }).from(appNotifications).innerJoin(orders, eq(appNotifications.orderId, orders.id))
    .where(eq(appNotifications.recipientUserId, currentUser.id))
    .orderBy(desc(appNotifications.createdAt)).limit(100);
  return <div className="notifications-page"><div className="pagehead"><div><div className="eyebrow">CẬP NHẬT ĐƠN HÀNG</div><h1>Tin báo</h1><p className="sub">Thông báo booking mới và thay đổi kế hoạch cấp bê tông.</p></div><Link className="btn secondary" href={appRole === "ACCOUNTANT" ? "/accounting" : "/orders"}>Mở danh sách đơn</Link></div>
    <NotificationSettings />
    <NotificationsInbox initialItems={rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), readAt: row.readAt?.toISOString() ?? null, requestedAt: row.requestedAt.toISOString(), plannedStartAt: row.plannedStartAt?.toISOString() ?? null }))} role={appRole} />
  </div>;
}
