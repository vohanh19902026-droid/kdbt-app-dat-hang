import assert from "node:assert/strict";
import test from "node:test";
import { canTransition, planningFields, validatePlanningState } from "../src/lib/order-rules";

const start = new Date("2026-10-31T02:00:00.000Z");
const end = new Date("2026-10-31T03:00:00.000Z");

test("booking workflow only allows forward business status transitions", () => {
  assert.equal(canTransition("PENDING", "APPROVED"), true);
  assert.equal(canTransition("APPROVED", "SCHEDULED"), true);
  assert.equal(canTransition("SCHEDULED", "IN_PROGRESS"), true);
  assert.equal(canTransition("IN_PROGRESS", "COMPLETED"), true);
  assert.equal(canTransition("COMPLETED", "PENDING"), false);
  assert.equal(canTransition("CANCELLED", "SCHEDULED"), false);
});

test("planning cannot finish earlier than the start time", () => {
  const error = validatePlanningState({
    status: "PENDING", plannedStartAt: end, plannedEndAt: start, assignedVehicle: "Xe bồn 01",
  });
  assert.equal(error, "Giờ đổ phải bằng hoặc sau giờ xuất phát.");
});

test("scheduled work requires both times and an assigned vehicle", () => {
  assert.match(validatePlanningState({
    status: "SCHEDULED", plannedStartAt: start, plannedEndAt: end, assignedVehicle: " ",
  }) || "", /phương tiện/);
  assert.equal(validatePlanningState({
    status: "SCHEDULED", plannedStartAt: start, plannedEndAt: end, assignedVehicle: "Xe bồn 01",
  }), null);
});

test("planner can update the contact person shown on a booking", () => {
  assert.ok(planningFields.includes("contactName"));
});

test("a new pending booking can wait for planning", () => {
  assert.equal(validatePlanningState({
    status: "PENDING", plannedStartAt: null, plannedEndAt: null, assignedVehicle: null,
  }), null);
});
