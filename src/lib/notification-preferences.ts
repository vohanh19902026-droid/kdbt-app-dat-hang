import type { AppRole } from "@/lib/types";

export type NotificationPreferences = {
  newBooking: boolean;
  orderUpdates: boolean;
  webPushEnabled: boolean;
  sourceUserIds: string[];
};

const defaults: NotificationPreferences = {
  newBooking: true,
  orderUpdates: true,
  webPushEnabled: false,
  sourceUserIds: [],
};

export function normalizeNotificationPreferences(value: unknown): NotificationPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...defaults };
  const source = value as Record<string, unknown>;
  return {
    newBooking: source.newBooking !== false,
    orderUpdates: source.orderUpdates !== false,
    webPushEnabled: source.webPushEnabled === true,
    sourceUserIds: Array.isArray(source.sourceUserIds)
      ? [...new Set(source.sourceUserIds.filter((id): id is string => typeof id === "string" && id.length > 0))].slice(0, 200)
      : [],
  };
}

export function shouldNotifyNewBooking(
  preferenceValue: unknown,
  sourceUserId: string,
  sourceRole: AppRole,
  recipientRole: AppRole,
): boolean {
  if (!(["ADMIN", "PLANNER"].includes(recipientRole) && sourceRole === "SALES")) return false;
  const preferences = normalizeNotificationPreferences(preferenceValue);
  return preferences.newBooking && (!preferences.sourceUserIds.length || preferences.sourceUserIds.includes(sourceUserId));
}

export function shouldNotifyOrderUpdate(
  preferenceValue: unknown,
  sourceUserId: string,
  sourceRole: AppRole,
  recipientRole: AppRole,
): boolean {
  if (recipientRole !== "SALES" || !["ADMIN", "PLANNER"].includes(sourceRole)) return false;
  const preferences = normalizeNotificationPreferences(preferenceValue);
  return preferences.orderUpdates && (!preferences.sourceUserIds.length || preferences.sourceUserIds.includes(sourceUserId));
}

export function notificationSourceRoles(role: AppRole): AppRole[] {
  if (role === "SALES") return ["ADMIN", "PLANNER"];
  if (role === "PLANNER" || role === "ADMIN") return ["SALES"];
  return [];
}
