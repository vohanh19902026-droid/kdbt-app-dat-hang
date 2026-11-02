/**
 * Smoke test trên môi trường production thật.
 *
 * Chạy:
 *   $env:SMOKE_BASE_URL="https://kdbt-app-dat-hang.vercel.app"
 *   $env:SMOKE_ADMIN_EMAIL="admin@cencom.vn"
 *   $env:SMOKE_ADMIN_PASSWORD="<mật khẩu admin>"
 *   npx tsx scripts/smoke-production.ts
 *
 * Script KHÔNG in mật khẩu/cookie ra log. Dữ liệu smoke được đánh dấu tiền tố
 * "SMOKE-" để dọn dẹp riêng (xem scripts/cleanup-smoke.ts).
 */
import ExcelJS from "exceljs";

const BASE = (process.env.SMOKE_BASE_URL || "").replace(/\/$/, "");
const EMAIL = process.env.SMOKE_ADMIN_EMAIL || "";
const PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || "";
const ORIGIN = BASE;

if (!BASE || !EMAIL || !PASSWORD) {
  console.error("[smoke] Cần SMOKE_BASE_URL, SMOKE_ADMIN_EMAIL, SMOKE_ADMIN_PASSWORD.");
  process.exit(2);
}

type Result = { name: string; ok: boolean; detail: string };
const results: Result[] = [];

function record(name: string, ok: boolean, detail: string): void {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${name} | ${detail}`);
}

function cookieHeader(response: Response): string {
  const jar = response.headers.getSetCookie?.() ?? [];
  return jar.map((item) => item.split(";")[0]).join("; ");
}

function vnToday(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

async function main(): Promise<void> {
  const today = vnToday();

  // 1. Health
  const health = await fetch(`${BASE}/api/health`, { headers: { accept: "application/json" } });
  const healthBody = (await health.json().catch(() => ({}))) as { status?: string; database?: string };
  record("health", health.status === 200 && healthBody.database === "up", `status=${health.status} database=${healthBody.database}`);

  // 2. Login
  const login = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const cookies = cookieHeader(login);
  await login.text();
  record("dang-nhap-admin", login.status === 200 && cookies.length > 0, `status=${login.status} cookie=${cookies.length > 0 ? "co" : "khong"}`);
  if (login.status !== 200 || !cookies) return;

  const authHeaders = { cookie: cookies, origin: ORIGIN, "content-type": "application/json" };
  let orderId = "";

  // 3. Tạo booking
  const create = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: authHeaders,
    body: JSON.stringify({
      customerName: `SMOKE-${Date.now()}`,
      siteAddress: "Công trường kiểm tra production, Quảng Nam",
      contactName: "Kiểm tra",
      contactPhone: "0900000000",
      requestedAt: `${today}T08:00:00+07:00`,
      quantityM3: 12.5,
      grade: "B25",
      sandType: "Cát vàng",
      stoneType: "Đá 1x2",
      pumpRequired: "Bơm cần",
      truckCapacityM3: 9,
      salesNote: "Bản ghi smoke test, sẽ được dọn.",
    }),
  });
  const createBody = (await create.json().catch(() => ({}))) as { order?: { id?: string; bookingNo?: string }; error?: string };
  orderId = createBody.order?.id || "";
  record("tao-booking", create.status === 201 && Boolean(orderId), `status=${create.status} bookingNo=${createBody.order?.bookingNo ?? "-"} ${createBody.error ?? ""}`);

  // 4. Dời ngày kế hoạch (version 0)
  if (orderId) {
    const patch1 = await fetch(`${BASE}/api/orders/${orderId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ plannedDate: today, plannedStartTime: "07:30", plannedEndTime: "10:00", assignedVehicle: "Xe 9m3 - smoke", version: 0 }),
    });
    const patch1Body = (await patch1.json().catch(() => ({}))) as { order?: { version?: number; plannedStartAt?: string } };
    record("doi-ngay-khong-loai-bo-booking", patch1.status === 200 && Number(patch1Body.order?.version) === 1, `status=${patch1.status} version=${patch1Body.order?.version}`);

    // 5. Ghi đè với version cũ phải 409
    const patch2 = await fetch(`${BASE}/api/orders/${orderId}`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ planningNote: "Ghi de bang version cu", version: 0 }),
    });
    await patch2.text();
    record("chan-ghi-de-version-cu", patch2.status === 409, `status=${patch2.status}`);

    // 6. Lịch sử thay đổi
    const events = await fetch(`${BASE}/api/orders/${orderId}/events`, { headers: { cookie: cookies } });
    const eventsBody = (await events.json().catch(() => ({}))) as { events?: unknown[]; error?: string };
    record("lich-su-thay-doi", events.status === 200 && (eventsBody.events?.length ?? 0) >= 2, `status=${events.status} soSuKien=${eventsBody.events?.length ?? 0}`);
  }

  // 7. Xuất XLSX mở được bằng ExcelJS
  const xlsx = await fetch(`${BASE}/api/exports/xlsx?date=${today}`, { headers: { cookie: cookies } });
  const buffer = Buffer.from(await xlsx.arrayBuffer());
  let sheetOk = false;
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    sheetOk = Boolean(workbook.worksheets[0]);
  } catch {
    sheetOk = false;
  }
  record("xuat-xlsx", xlsx.status === 200 && sheetOk, `status=${xlsx.status} bytes=${buffer.length} docDuoc=${sheetOk}`);

  // 8. Chặn Origin lạ
  const forged = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: { ...authHeaders, origin: "https://evil.example" },
    body: JSON.stringify({ customerName: "SMOKE-forged", siteAddress: "abc", requestedAt: `${today}T08:00:00+07:00`, quantityM3: 1, grade: "B25", sandType: "Cát", stoneType: "Đá" }),
  });
  await forged.text();
  record("chan-origin-la", forged.status === 403, `status=${forged.status}`);

  // 9. RBAC: chưa đăng nhập phải 401
  const anonymous = await fetch(`${BASE}/api/orders?date=${today}`);
  await anonymous.text();
  record("chan-chua-dang-nhap", anonymous.status === 401, `status=${anonymous.status}`);

  // 10. Trang login trả 200 + CSP
  const loginPage = await fetch(`${BASE}/login`);
  const csp = loginPage.headers.get("content-security-policy") || "";
  await loginPage.text();
  record("trang-login-va-csp", loginPage.status === 200 && csp.includes("frame-ancestors 'none'"), `status=${loginPage.status} csp=${csp ? "co" : "thieu"}`);

  // 11. Các trang nghiệp vụ render được khi đã đăng nhập (bắt lỗi SSR/Tabulator)
  for (const path of ["/orders", "/planning", "/reports", "/customers", "/admin/users"]) {
    const page = await fetch(`${BASE}${path}`, { headers: { cookie: cookies } });
    const html = await page.text();
    const crashed = /Application error|Internal Server Error|client-side exception/i.test(html);
    record(`trang${path}`, page.status === 200 && !crashed, `status=${page.status} loiTrang=${crashed}`);
  }

  // 12. API quản trị tài khoản (RBAC Admin)
  const users = await fetch(`${BASE}/api/admin/users`, { headers: { cookie: cookies } });
  const usersBody = (await users.json().catch(() => [])) as unknown[];
  record("api-admin-users", users.status === 200 && Array.isArray(usersBody) && usersBody.length >= 1, `status=${users.status} soTaiKhoan=${Array.isArray(usersBody) ? usersBody.length : "-"}`);

  const failed = results.filter((item) => !item.ok);
  console.log(`\n[smoke] ${results.length - failed.length}/${results.length} PASS`);
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(`[smoke] LỖI: ${(error as Error).message}`);
  process.exitCode = 1;
});
