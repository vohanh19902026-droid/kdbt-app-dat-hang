import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";
import { eq, like } from "drizzle-orm";

async function main() {
const databaseUrl = "postgresql://postgres@127.0.0.1:55432/cencom_accounting_test";
process.env.DATABASE_URL = databaseUrl;
if (new URL(databaseUrl).hostname !== "127.0.0.1" || new URL(databaseUrl).port !== "55432" || new URL(databaseUrl).pathname !== "/cencom_accounting_test") {
  throw new Error("UAT is restricted to the local cencom_accounting_test database.");
}

const [{ db }, schema, settingsModule, dateModule] = await Promise.all([
  import("@/db"), import("@/db/schema"), import("@/lib/app-settings"), import("@/lib/vn-date"),
]);
const runId = randomUUID().slice(0, 8);
const marker = `CENCOM UAT ${runId}`;
const accountRows: Array<{ id: string; email: string; password: string; role: "ADMIN" | "PLANNER" | "SALES" }> = [];
const timings: Record<string, number> = {};
const pageErrors: string[] = [];
const proofDir = path.join(tmpdir(), `cencom-uat-${runId}`);
const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

async function makeAccount(role: "ADMIN" | "PLANNER" | "SALES") {
  const id = randomUUID();
  const password = randomBytes(24).toString("base64url");
  const email = `uat-${role.toLowerCase()}-${runId}@example.test`;
  const passwordHash = await hashPassword(password);
  await db.insert(schema.user).values({ id, name: `${marker} ${role}`, email, emailVerified: true, role: role === "ADMIN" ? "admin" : "user", appRole: role, isActive: true });
  await db.insert(schema.account).values({ id: randomUUID(), accountId: id, providerId: "credential", userId: id, password: passwordHash });
  const row = { id, email, password, role };
  accountRows.push(row);
  return row;
}

async function login(page: import("@playwright/test").Page, account: typeof accountRows[number]) {
  await page.goto("http://127.0.0.1:3104/login");
  await page.locator("#email").fill(account.email);
  await page.locator("#password").fill(account.password);
  const started = performance.now();
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.waitForURL("**/orders", { timeout: 10000 });
  timings[`login_${account.role.toLowerCase()}_ms`] = Math.round(performance.now() - started);
}

try {
  const [admin, planner, sales] = await Promise.all([makeAccount("ADMIN"), makeAccount("PLANNER"), makeAccount("SALES")]);
  await mkdir(proofDir, { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: edgePath });
  const salesContext = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const salesPage = await salesContext.newPage();
  salesPage.on("pageerror", (error) => pageErrors.push(error.message));
  salesPage.on("console", (message) => { if (message.type() === "error") pageErrors.push(message.text()); });
  await login(salesPage, sales);
  await salesPage.goto("http://127.0.0.1:3104/notifications");
  await salesPage.getByText(`${marker} PLANNER`).waitFor({ timeout: 10000 });
  await salesPage.getByText("Kế hoạch duyệt hoặc cập nhật đơn").waitFor({ timeout: 10000 });
  assert.equal(await salesPage.getByText("Booking mới cần duyệt").count(), 0, "Sales only sees notification preferences for order updates");
  await salesPage.locator(".notification-source-list label").filter({ hasText: `${marker} PLANNER` }).locator("input").check();
  const prefStarted = performance.now();
  await salesPage.getByRole("button", { name: "Lưu thiết lập" }).click();
  await salesPage.getByRole("status").filter({ hasText: "Đã lưu" }).waitFor({ timeout: 10000 });
  timings.preferences_save_ms = Math.round(performance.now() - prefStarted);
  await salesPage.screenshot({ path: path.join(proofDir, "01-sales-mobile-notifications.png"), fullPage: true });

  const date = dateModule.addIsoDays(dateModule.todayVN(), 1);
  await salesPage.goto(`http://127.0.0.1:3104/orders?date=${date}`);
  await salesPage.getByRole("button", { name: "Tạo booking" }).click();
  await salesPage.locator("#existing-customer").selectOption("new");
  await salesPage.locator('input[name="customerName"]').fill(`${marker} Khách hàng`);
  await salesPage.locator('input[name="siteAddress"]').fill("Khu thử nghiệm local, đường UAT");
  await salesPage.locator('input[name="contactName"]').fill("Người nhận UAT");
  await salesPage.locator('input[name="contactPhone"]').fill("0900000000");
  await salesPage.locator('input[name="quantityM3"]').fill("8.5");
  const catalog = settingsModule.defaultAppSettings.catalog;
  await salesPage.locator('input[name="grade"]').fill(String(catalog.grades[0]));
  await salesPage.locator('input[name="date"]').fill(date);
  await salesPage.locator('input[name="time"]').fill("13:30");
  await salesPage.locator('select[name="pumpRequired"]').selectOption({ index: 0 });
  await salesPage.locator('input[name="sandType"]').fill(String(catalog.sandTypes[0]));
  await salesPage.locator('input[name="stoneType"]').fill(String(catalog.stoneTypes[0]));
  await salesPage.locator('select[name="truckCapacityM3"]').selectOption({ index: 0 });
  if (catalog.pourTypes.length) await salesPage.locator('select[name="pourType"]').selectOption({ index: 1 });
  await salesPage.locator('select[name="pourMethod"]').selectOption({ index: 0 });
  await salesPage.locator('select[name="siteCategory"]').selectOption({ index: 0 });
  await salesPage.locator('textarea[name="salesNote"]').fill("Kiểm thử luồng đặt hàng UAT; dữ liệu local");
  await salesPage.screenshot({ path: path.join(proofDir, "02-sales-mobile-booking-form.png"), fullPage: true });
  let createdOrder: { order: { id: string; bookingNo: string; status: string } } | undefined;
  salesPage.on("response", async (response) => {
    if (response.url().includes("/api/orders") && response.request().method() === "POST") {
      try { createdOrder = await response.json(); } catch { /* A non-JSON API error is asserted after submission. */ }
    }
  });
  const createStarted = performance.now();
  await salesPage.getByRole("button", { name: /Gửi lệnh đặt hàng/ }).click();
  await salesPage.getByText(/BOOK-/).first().waitFor({ timeout: 10000 });
  assert.equal(createdOrder?.order.status, "PENDING", "Sales booking begins in PENDING state");
  timings.booking_create_ms = Math.round(performance.now() - createStarted);
  const bookingNo = createdOrder?.order.bookingNo;
  const orderId = createdOrder?.order.id;
  assert.ok(bookingNo && orderId, "Create booking returned generated booking number and id");

  const plannerContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const plannerPage = await plannerContext.newPage();
  plannerPage.on("pageerror", (error) => pageErrors.push(error.message));
  await login(plannerPage, planner);
  await plannerPage.goto(`http://127.0.0.1:3104/receiving?date=${date}`);
  await plannerPage.getByText(bookingNo).waitFor({ timeout: 10000 });
  await plannerPage.screenshot({ path: path.join(proofDir, "03-planner-desktop-receiving.png"), fullPage: true });
  const row = plannerPage.locator(".tabulator-row").filter({ hasText: bookingNo });
  const approvalStarted = performance.now();
  await row.locator('.tabulator-cell[tabulator-field="status"]').click();
  await plannerPage.locator(".tabulator-edit-list-item").filter({ hasText: /xác nhận/i }).click();
  await plannerPage.waitForFunction(async (id) => {
    const response = await fetch(`/api/orders?date=${new URL(location.href).searchParams.get("date")}`);
    const records = await response.json();
    return records.some((record: { id: string; status: string }) => record.id === id && record.status === "APPROVED");
  }, orderId, { timeout: 10000 });
  timings.planner_approval_ms = Math.round(performance.now() - approvalStarted);
  await plannerPage.goto("http://127.0.0.1:3104/notifications");
  await plannerPage.getByText(`Booking mới ${bookingNo}`).waitFor({ timeout: 10000 });
  await plannerPage.screenshot({ path: path.join(proofDir, "04-planner-notification.png"), fullPage: true });

  await salesPage.goto("http://127.0.0.1:3104/notifications");
  await salesPage.getByText(`Booking ${bookingNo} đã được xác nhận`).waitFor({ timeout: 10000 });
  await salesPage.screenshot({ path: path.join(proofDir, "05-sales-approval-notification-mobile.png"), fullPage: true });

  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const adminPage = await adminContext.newPage();
  adminPage.on("pageerror", (error) => pageErrors.push(error.message));
  await login(adminPage, admin);
  await adminPage.goto("http://127.0.0.1:3104/notifications");
  await adminPage.getByText(`${marker} SALES`).waitFor({ timeout: 10000 });
  await adminPage.getByText("Booking mới cần duyệt").waitFor({ timeout: 10000 });
  assert.equal(await adminPage.getByText("Kế hoạch duyệt hoặc cập nhật đơn").count(), 0, "Admin only sees notification preferences for incoming bookings");
  await adminPage.getByRole("heading", { name: "Tin báo" }).waitFor();
  await adminPage.screenshot({ path: path.join(proofDir, "06-admin-notification-settings.png"), fullPage: true });

  assert.equal(pageErrors.length, 0, `No page errors: ${pageErrors.join(" | ")}`);
  const report = { status: "PASS", roles: ["SALES", "PLANNER", "ADMIN"], bookingNo, date, timings, pageErrors, screenshots: proofDir, note: "Push transport remains unconfigured until the deployment has VAPID environment keys; in-app delivery was verified." };
  await writeFile(path.join(proofDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await plannerContext.close(); await adminContext.close(); await salesContext.close();
} catch (error) {
  await browser?.close();
  throw error;
} finally {
  await browser?.close();
  await db.delete(schema.orders).where(like(schema.orders.customerName, `${marker}%`));
  await db.delete(schema.customers).where(like(schema.customers.name, `${marker}%`));
  for (const account of accountRows) {
    await db.delete(schema.user).where(eq(schema.user.id, account.id));
  }
  await db.$client.end();
}
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Local UAT failed.");
  process.exitCode = 1;
});
