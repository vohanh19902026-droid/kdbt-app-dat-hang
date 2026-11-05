import test from "node:test";
import assert from "node:assert/strict";
import { normalizeNotificationPreferences, shouldNotifyNewBooking, shouldNotifyOrderUpdate } from "../src/lib/notification-preferences";

test("legacy accounts default to inbox notifications from every valid source", () => {
  assert.deepEqual(normalizeNotificationPreferences(undefined), { newBooking: true, orderUpdates: true, webPushEnabled: false, sourceUserIds: [] });
  assert.equal(shouldNotifyNewBooking({}, "sales-1", "SALES", "PLANNER"), true);
  assert.equal(shouldNotifyOrderUpdate({}, "planner-1", "PLANNER", "SALES"), true);
});

test("notification source selections and event switches are enforced", () => {
  const selected = { newBooking: true, orderUpdates: false, sourceUserIds: ["sales-2"] };
  assert.equal(shouldNotifyNewBooking(selected, "sales-1", "SALES", "ADMIN"), false);
  assert.equal(shouldNotifyNewBooking(selected, "sales-2", "SALES", "ADMIN"), true);
  assert.equal(shouldNotifyOrderUpdate(selected, "planner-1", "PLANNER", "SALES"), false);
  assert.equal(shouldNotifyNewBooking(selected, "planner-1", "PLANNER", "SALES"), false);
});

test("malformed preferences normalize safely and source ids are bounded/deduplicated", () => {
  assert.equal(normalizeNotificationPreferences(null).newBooking, true);
  assert.deepEqual(normalizeNotificationPreferences({ sourceUserIds: ["x", "x", 7] }).sourceUserIds, ["x"]);
});
