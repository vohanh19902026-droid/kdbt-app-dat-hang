import assert from "node:assert/strict";
import test from "node:test";
import { createdOrderNotification, updatedOrderNotification } from "../src/lib/order-notification";

test("new booking notification identifies booking, customer, volume and review state", () => {
  const message = createdOrderNotification("BOOK-7431", "Công ty Minh An", 12.5);
  assert.match(message.title, /BOOK-7431/);
  assert.match(message.body, /Công ty Minh An/);
  assert.match(message.body, /12,5/);
  assert.match(message.body, /duyệt/i);
});

test("planning notification translates status and bounds the message", () => {
  const message = updatedOrderNotification({
    bookingNo: "BOOK-7431", customerName: "Minh An",
    changes: [
      { fieldName: "status", newValue: "SCHEDULED" },
      { fieldName: "assignedVehicle", newValue: "Bơm cần 37m" },
    ],
  });
  assert.match(message.title, /BOOK-7431/);
  assert.match(message.body, /Đã xếp lịch/);
  assert.match(message.body, /Bơm cần 37m/);
  assert.ok(message.body.length <= 1000);
});
