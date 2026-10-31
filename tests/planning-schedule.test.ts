import assert from "node:assert/strict";
import test from "node:test";
import { resolvePlanningTimes } from "../src/lib/planning-schedule";

const requestedAt = new Date("2026-10-30T03:00:00.000Z"); // 10:00 ngày 30/10 giờ VN
const startAt = new Date("2026-10-31T02:00:00.000Z"); // 09:00 ngày 31/10 giờ VN
const endAt = new Date("2026-10-31T03:00:00.000Z"); // 10:00 ngày 31/10 giờ VN
const current = { requestedAt, plannedStartAt: startAt, plannedEndAt: endAt };

test("changing only the start time keeps the scheduled day", () => {
  const result = resolvePlanningTimes(current, { plannedStartTime: "10:30" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.startAt?.toISOString(), "2026-10-31T03:30:00.000Z");
  assert.equal(result.endAt?.toISOString(), endAt.toISOString());
});

test("moving the plan date keeps the existing times", () => {
  const result = resolvePlanningTimes(current, { plannedDate: "2026-11-02" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.startAt?.toISOString(), "2026-11-02T02:00:00.000Z");
  assert.equal(result.endAt?.toISOString(), "2026-11-02T03:00:00.000Z");
});

test("moving date and times in one patch applies both", () => {
  const result = resolvePlanningTimes(current, { plannedDate: "2026-11-02", plannedStartTime: "06:00", plannedEndTime: "07:30" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.startAt?.toISOString(), "2026-11-01T23:00:00.000Z");
  assert.equal(result.endAt?.toISOString(), "2026-11-02T00:30:00.000Z");
});

test("an unscheduled plan anchors a new time on the requested day", () => {
  const result = resolvePlanningTimes(
    { requestedAt, plannedStartAt: null, plannedEndAt: null },
    { plannedStartTime: "08:00", plannedEndTime: "09:00" },
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.startAt?.toISOString(), "2026-10-30T01:00:00.000Z");
  assert.equal(result.endAt?.toISOString(), "2026-10-30T02:00:00.000Z");
});

test("clearing a time sets it back to null", () => {
  const result = resolvePlanningTimes(current, { plannedStartTime: "", plannedEndTime: null });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.startAt, null);
  assert.equal(result.endAt, null);
});

test("invalid date or time is rejected with a Vietnamese error", () => {
  const badDate = resolvePlanningTimes(current, { plannedDate: "2026-02-30" });
  assert.equal(badDate.ok, false);
  const badTime = resolvePlanningTimes(current, { plannedStartTime: "25:00" });
  assert.equal(badTime.ok, false);
});
