import { expect, test } from "@playwright/test";

function watchPageErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("login page renders Vietnamese sign-in and registration guidance", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "Đăng nhập hệ thống" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đăng nhập / đăng ký bằng Google" })).toBeVisible();
  await expect(page.getByLabel("Email / tài khoản")).toBeVisible();
  await expect(page.getByLabel("Mật khẩu")).toBeVisible();
  await expect(page.getByRole("link", { name: "Quên mật khẩu CENCOM?" })).toBeVisible();
  await expect(page.getByText("Tài khoản mới cần Admin kích hoạt", { exact: false })).toBeVisible();
  await expect(page.locator("body")).not.toContainText(/[ÃÂ�]/);
  expect(pageErrors).toEqual([]);
});

test("login form exposes a busy state and translates a mocked authentication error", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  await page.route("**/api/auth/sign-in/email", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 150));
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ message: "Invalid email or password", code: "INVALID_EMAIL_OR_PASSWORD" }),
    });
  });

  await page.goto("/login");
  await page.getByLabel("Email / tài khoản").fill("user@example.test");
  await page.getByLabel("Mật khẩu").fill("not-a-real-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();

  await expect(page.getByRole("button", { name: "Đang xác thực..." })).toBeDisabled();
  await expect(page.locator(".login-error[role='alert']")).toHaveText("Tài khoản hoặc mật khẩu chưa đúng. Vui lòng thử lại.");
  await expect(page.getByRole("button", { name: "Đăng nhập", exact: true })).toBeEnabled();
  expect(pageErrors).toEqual([]);
});

test("password reset page explains email verification and shows a mocked success state", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  await page.setViewportSize({ width: 375, height: 667 });
  await page.route("**/api/auth/request-password-reset", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ status: true }),
  }));

  await page.goto("/forgot-password");
  await expect(page.getByRole("heading", { name: "Quên mật khẩu CENCOM?" })).toBeVisible();
  await expect(page.getByLabel("Email tài khoản")).toBeVisible();
  await expect(page.getByText("hãy khôi phục tài khoản Google tại Google", { exact: false })).toBeVisible();
  await page.getByLabel("Email tài khoản").fill("user@example.test");
  await page.getByRole("button", { name: "Gửi liên kết xác minh" }).click();
  await expect(page.getByRole("status")).toContainText("Hãy kiểm tra cả mục Spam.");
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("reset form rejects a missing token without contacting authentication or database", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  await page.setViewportSize({ width: 414, height: 896 });
  await page.goto("/reset-password");
  await expect(page.getByRole("heading", { name: "Tạo mật khẩu mới" })).toBeVisible();
  await page.getByLabel("Mật khẩu mới").fill("a-long-test-password");
  await page.getByLabel("Nhập lại mật khẩu").fill("a-long-test-password");
  await page.getByRole("button", { name: "Xác nhận mật khẩu mới" }).click();
  await expect(page.locator(".login-error[role='alert']")).toContainText("Liên kết không hợp lệ hoặc đã hết hạn");
  await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(pageErrors).toEqual([]);
});

test("protected workspace routes send a signed-out visitor to login", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  for (const route of ["/orders", "/admin/settings"]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("heading", { name: "Đăng nhập hệ thống" })).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
});

test("login page fits a narrow mobile viewport", async ({ page }) => {
  const pageErrors = watchPageErrors(page);
  for (const width of [375, 414]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Đăng nhập hệ thống" })).toBeVisible();
    await expect.poll(async () => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  expect(pageErrors).toEqual([]);
});
