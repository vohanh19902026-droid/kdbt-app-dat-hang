import webpush from "web-push";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { appNotifications, pushSubscriptions, user } from "@/db/schema";
import { normalizeNotificationPreferences } from "@/lib/notification-preferences";

type PushPayload = { title: string; body: string; url: string };

export async function deliverWebPush(notificationIds: string[], payload: PushPayload) {
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT;
  if (!notificationIds.length || !publicKey || !privateKey || !subject) return;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  const notificationRows = await db.select({ recipientUserId: appNotifications.recipientUserId })
    .from(appNotifications).where(inArray(appNotifications.id, notificationIds));
  const recipientIds = [...new Set(notificationRows.map((row) => row.recipientUserId))];
  if (!recipientIds.length) return;
  const subscriptions = await db.select({ subscription: pushSubscriptions, preferences: user.notificationPreferences })
    .from(pushSubscriptions).innerJoin(user, eq(pushSubscriptions.userId, user.id))
    .where(and(inArray(pushSubscriptions.userId, recipientIds), eq(user.isActive, true)));
  const deliverable = subscriptions.filter(({ preferences }) => normalizeNotificationPreferences(preferences).webPushEnabled);
  const staleIds: string[] = [];
  await Promise.allSettled(deliverable.map(async ({ subscription }) => {
    try {
      await webpush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, JSON.stringify(payload), { TTL: 60, urgency: "high" });
    } catch (error) {
      const statusCode = typeof error === "object" && error !== null && "statusCode" in error ? Number((error as { statusCode?: unknown }).statusCode) : 0;
      if (statusCode === 404 || statusCode === 410) staleIds.push(subscription.id);
    }
  }));
  if (staleIds.length) await db.delete(pushSubscriptions).where(inArray(pushSubscriptions.id, staleIds));
}
