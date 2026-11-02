import assert from "node:assert/strict";
import test from "node:test";
import {
  addIsoDays, clampIsoDateRange, combineVnDateTime, isValidIsoDate, isValidTime, normalizeIsoDate, todayVN,
  vnDateOf, vnDateRange, vnTimeOf,
} from "../src/lib/vn-date";

test("todayVN returns a real ISO calendar date", () => {
  assert.match(todayVN(new Date("2026-10-31T17:30:00.000Z")), /^2026-11-01$/);
  assert.match(todayVN(), /^\d{4}-\d{2}-\d{2}$/);
});

test("isValidIsoDate rejects impossible or malformed dates", () => {
  assert.equal(isValidIsoDate("2026-02-28"), true);
  assert.equal(isValidIsoDate("2024-02-29"), true);
  assert.equal(isValidIsoDate("2026-02-30"), false);
  assert.equal(isValidIsoDate("2026-13-01"), false);
  assert.equal(isValidIsoDate("31/10/2026"), false);
  assert.equal(isValidIsoDate(""), false);
  assert.equal(isValidIsoDate(null), false);
  assert.equal(isValidIsoDate("1999-12-31"), false);
});

test("normalizeIsoDate falls back instead of crashing on bad query input", () => {
  assert.equal(normalizeIsoDate("2026-10-31", "2026-01-01"), "2026-10-31");
  assert.equal(normalizeIsoDate("2026-99-99", "2026-01-01"), "2026-01-01");
  assert.equal(normalizeIsoDate(undefined, "2026-01-01"), "2026-01-01");
});

test("vnDateRange covers exactly one Vietnam day", () => {
  const { from, to } = vnDateRange("2026-10-31");
  assert.equal(from.toISOString(), "2026-10-30T17:00:00.000Z");
  assert.equal(to.toISOString(), "2026-10-31T17:00:00.000Z");
  assert.throws(() => vnDateRange("2026-02-30"), RangeError);
});

test("Vietnam date and time helpers convert across midnight UTC", () => {
  assert.equal(vnDateOf(new Date("2026-10-31T17:30:00.000Z")), "2026-11-01");
  assert.equal(vnTimeOf(new Date("2026-10-31T02:15:00.000Z")), "09:15");
});

test("combineVnDateTime only accepts real dates and HH:MM time", () => {
  assert.equal(combineVnDateTime("2026-10-31", "09:15")?.toISOString(), "2026-10-31T02:15:00.000Z");
  assert.equal(combineVnDateTime("2026-10-31", "24:00"), null);
  assert.equal(combineVnDateTime("2026-02-30", "09:15"), null);
  assert.equal(isValidTime("23:59"), true);
  assert.equal(isValidTime("7:05"), false);
});

test("addIsoDays crosses month and year boundaries", () => {
  assert.equal(addIsoDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addIsoDays("2026-03-01", -1), "2026-02-28");
  assert.equal(addIsoDays("2024-02-28", 1), "2024-02-29");
  assert.throws(() => addIsoDays("2026-02-30", 1), RangeError);
  assert.throws(() => addIsoDays("2026-01-01", 1.5), RangeError);
});

test("clampIsoDateRange keeps short ranges and caps long ones", () => {
  assert.deepEqual(clampIsoDateRange("2026-11-01", "2026-11-30", 92), {
    from: "2026-11-01", to: "2026-11-30", clamped: false,
  });
  assert.deepEqual(clampIsoDateRange("2026-11-01", "2027-06-01", 92), {
    from: "2026-11-01", to: "2027-01-31", clamped: true,
  });
  // Ngày kết thúc trước ngày bắt đầu thì thu về đúng ngày bắt đầu, không ném lỗi.
  assert.deepEqual(clampIsoDateRange("2026-11-10", "2026-11-01", 92), {
    from: "2026-11-10", to: "2026-11-10", clamped: false,
  });
  assert.throws(() => clampIsoDateRange("2026-11-01", "2026-11-02", 0), RangeError);
});
