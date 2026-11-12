# NHIỆM VỤ — Frontend/UX Verification & E2E Testing

> **Giao cho:** Agent tiếp theo
> **PLAN:** [PLAN-2026-11-12.md](PLAN-2026-11-12.md)
> **CHANGELOG:** [CHANGELOG-2026-11-12.md](CHANGELOG-2026-11-12.md)
> **Bắt đầu:** 12/11/2026

---

## 🎯 MỤC TIÊU

Tiếp tục **P1** — kiểm tra public UI, xác minh cấu hình Preview khi có đúng môi trường/owner inputs, và bổ sung E2E an toàn. Không dùng Production làm môi trường thử.

### Trạng thái đã xác minh ngày 12/11/2026

- Playwright được cấu hình, Chromium cài đặt; `npm run test:e2e` đạt 6/6 với mock auth/email API, không kết nối database.
- Public login/forgot/reset UI, signed-out redirect và responsive login 375/414px đã kiểm tra. E2E phát hiện và sửa proxy chặn `/reset-password`.
- `/orders`, `/admin/settings` chỉ được xác nhận redirect khi signed-out. Chưa xác minh trang có dữ liệu, CRUD, tìm khách, hoặc role permissions.
- Vercel metadata (không giải mã): OAuth và SMTP cơ bản chỉ gắn Preview branch `codex/cencom-owner-preview`; không thấy `SMTP_APP_PASSWORD`. VAPID variable names có ở Preview/Production nhưng giá trị chưa được xác minh.
- Chưa thay đổi Google OAuth, SMTP, VAPID, Vercel env, Neon, hay Production. Việc email/OAuth thật cần đúng Preview URL và owner phải nhập secret trực tiếp trong provider dashboard.

---

## 📋 NHIỆM VỤ CHI TIẾT

### P1.1: Frontend/UX Verification (#16-20)

**Mục tiêu:** Kiểm tra giao diện người dùng hoạt động đúng trên local.

#### #16 Verify UI components render
```powershell
# Chạy dev server
npm run dev

# Mở trình duyệt kiểm tra các trang:
# - http://localhost:3000/login
# - http://localhost:3000/orders (cần đăng nhập)
# - http://localhost:3000/admin/settings (cần Admin)
# - http://localhost:3000/forgot-password
# - http://localhost:3000/reset-password
```

**Tiêu chí hoàn thành:**
- [ ] `/login` hiển thị form đăng nhập + nút "Đăng nhập Google"
- [ ] `/forgot-password` hiển thị form email
- [ ] `/reset-password` hiển thị form mật khẩu mới
- [ ] `/orders` hiển thị bảng booking (20 dòng/trang)
- [ ] `/admin/settings` hiển thị tab cài đặt
- [ ] Không có lỗi console (F12 → Console)

#### #17 Kiểm tra responsive design
```
Desktop: 1920x1080, 1366x768
Tablet: 768x1024
Mobile: 375x667 (iPhone), 414x896 (iPhone Plus)
```

**Tiêu chí hoàn thành:**
- [ ] Menu hamburger hiển thị trên mobile
- [ ] Bảng booking scroll ngang trên mobile
- [ ] Form đăng nhập center trên mọi kích thước
- [ ] Không có text tràn khỏi container

#### #18 Verify Vietnamese text
**Tiêu chí hoàn thành:**
- [ ] Không có text English leaked (trừ tên kỹ thuật)
- [ ] Font display đúng (Times New Roman / Arial)
- [ ] Dấu tiếng Việt hiển thị đúng (ă, â, ê, ô, ơ, ư, đ)

#### #19 Kiểm tra loading states
**Tiêu chí hoàn thành:**
- [ ] Skeleton loader khi tải bảng booking
- [ ] Spinner khi submit form
- [ ] Button disabled khi đang submit

#### #20 Verify error states
**Tiêu chí hoàn thành:**
- [ ] Hiển thị lỗi đẹp khi API fail
- [ ] Không crash white screen
- [ ] Toast notification khi thành công/lỗi

---

### P1.2: Email/OAuth/Push Configuration (#39-43)

**Mục tiêu:** Chỉ xác minh cấu hình Preview hiện có; không dùng domain Production để thử và không thay cấu hình Production.

> ⚠️ **LƯU Ý:** Không paste secrets vào chat, log, hoặc git.

#### #39 Cấu hình Google OAuth
**Bước:**
1. Xác định đúng một deployment Preview và URL ổn định cho kiểm thử.
2. Kiểm tra OAuth client hiện tại có origin và callback URL khớp **URL Preview đó** hay không.
3. Chỉ tạo/cập nhật `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` trong Preview nếu thiếu; không tạo thêm OAuth client trùng lặp.
4. Không đưa secret hoặc mã xác minh vào chat, terminal log hay Git. Nếu chủ tài khoản cần thao tác xác minh, dừng tại tab phù hợp để họ tự nhập.

**Tiêu chí hoàn thành:**
- [ ] Client ID + Secret đã lưu trong Vercel
- [ ] Authorized origins khớp URL Preview được chọn
- [ ] Redirect URI khớp callback Preview `/api/auth/callback/google`

#### #40 Cấu hình SMTP
**Bước:**
1. Nếu `SMTP_APP_PASSWORD` Preview còn thiếu, chủ tài khoản tự tạo App Password và nhập trực tiếp vào ô Secret Preview trong Vercel.
2. Không yêu cầu gửi App Password trong chat và không mở/đọc Gmail để lấy mã xác minh thay chủ tài khoản.
3. Kiểm tra tên biến, target environment và trạng thái đã lưu mà không hiển thị secret.

**Tiêu chí hoàn thành:**
- [ ] SMTP_USER = email Gmail
- [ ] SMTP_APP_PASSWORD = App password (16 ký tự)
- [ ] Chỉ lưu ở Preview; Production không đổi

#### #41 Cấu hình VAPID keys
**Bước:**
```powershell
# Tạo riêng cặp key cho Preview; private key chỉ lưu thành Secret Preview
npx web-push generate-vapid-keys
```
2. Vào Vercel Dashboard → Settings → Environment Variables
3. Thêm `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY`, `WEB_PUSH_VAPID_SUBJECT`

**Tiêu chí hoàn thành:**
- [ ] VAPID keys đã lưu trong Vercel
- [ ] Mỗi môi trường (Preview/Production) có key riêng

#### #42 Test email reset flow
**Bước:**
1. Mở `/forgot-password`
2. Nhập email thật
3. Kiểm tra email nhận được link reset
4. Click link → đổi mật khẩu
5. Đăng nhập bằng mật khẩu mới

**Tiêu chí hoàn thành:**
- [ ] Email gửi thành công
- [ ] Link reset hoạt động
- [ ] Đổi mật khẩu thành công
- [ ] Đăng nhập bằng mật khẩu mới được

#### #43 Test Google sign-in
**Bước:**
1. Mở `/login`
2. Click "Đăng nhập Google"
3. Đăng nhập bằng tài khoản Google
4. Kiểm tra redirect sau đăng nhập

**Tiêu chí hoàn thành:**
- [ ] Redirect đến Google thành công
- [ ] Đăng nhập Google thành công
- [ ] Redirect về `/orders` sau đăng nhập
- [ ] Session hoạt động đúng

---

### P1.3: E2E Testing Setup (#44-48)

**Mục tiêu:** Thiết lập Playwright và viết test cho luồng chính.

#### #44 Setup Playwright
**Bước:**
```powershell
# Playwright đã nằm trong devDependencies
npx playwright install chromium
npm run test:e2e
```

**Tiêu chí hoàn thành:**
- [ ] Playwright đã cài đặt
- [ ] File `playwright.config.ts` đã tạo
- [ ] Browser đã download (Chromium)

#### #45 Test login flow
**Implementation:** `tests/e2e/public-auth-ux.spec.ts` checks login UI and intercepts sign-in with a mocked 401 response. This is not proof of real email/Google authentication or session creation.

**Tiêu chí hoàn thành:**
- [ ] Test login form hiển thị đúng
- [ ] Test lỗi đăng nhập hiển thị đúng
- [ ] `npx playwright test` pass

#### #46 Test booking CRUD
Chưa tạo test CRUD. Chỉ triển khai sau khi có database test cô lập và tài khoản test dùng riêng. Không hardcode thông tin đăng nhập, không dùng Production, và không thực hiện xóa trên dữ liệu người dùng thật.

**Tiêu chí hoàn thành:**
- [ ] Test tạo booking
- [ ] Test sửa booking
- [ ] Test xóa booking
- [ ] `npx playwright test` pass

#### #47 Test customer search
Chưa thể kiểm tra tìm khách qua UI vì `/orders` cần session và database. Khi có DB test riêng, dùng dữ liệu khách giả lập và kiểm tra ngưỡng 2 ký tự, giới hạn 30 kết quả, quyền SALES, và phân trang 20 booking. Không dùng dữ liệu khách Production.

**Tiêu chí hoàn thành:**
- [ ] Test search với < 2 ký tự
- [ ] Test search với ≥ 2 ký tự
- [ ] Test phân trang (20 dòng/trang)
- [ ] `npx playwright test` pass

#### #48 Test role permissions
Chưa tạo test phân quyền theo role. Cần fixture user cho SALES, PLANNER và ADMIN trên DB test cô lập. Các test public trong `tests/e2e/public-auth-ux.spec.ts` chỉ xác nhận signed-out redirect, không chứng minh role authorization.

**Tiêu chí hoàn thành:**
- [ ] SALES không truy cập admin; PLANNER và ADMIN chỉ truy cập đúng phạm vi trên DB test cô lập
- [ ] Chưa đánh dấu role E2E đạt nếu chỉ có unit test policy hoặc signed-out redirect

---

## ✅ TIÊU CHÍ HOÀN THÀNH CHUNG

- [ ] Tất cả test pass: `npx playwright test`
- [ ] Không có lỗi console khi test
- [ ] Docs đã cập nhật (CHANGELOG, PLAN)
- [ ] Không có secret trong code/test

---

## 📁 FILES CẦN TẠO/SỬA

| File | Hành động |
|------|-----------|
| `playwright.config.ts` | Tạo mới |
| `tests/e2e/public-auth-ux.spec.ts` | Tạo mới — public UI, mock response, không truy cập DB |
| `tests/e2e/booking.spec.ts` | Chờ DB test cô lập |
| `tests/e2e/customer-search.spec.ts` | Chờ session + DB test cô lập |
| `tests/e2e/role-permissions.spec.ts` | Chờ role fixtures + DB test cô lập |
| `docs/CHANGELOG-2026-11-12.md` | Cập nhật tiến độ |
| `docs/PLAN-2026-11-12.md` | Đánh dấu [x] |

---

## 🔧 LỆNH CHẠY

```powershell
# 1. Chạy dev server (terminal 1)
npm run dev

# 2. Chạy Playwright test (terminal 2)
npx playwright test

# 3. Xem kết quả trong browser
npx playwright show-report
```

---

## ⚠️ LƯU Ý AN TOÀN

1. **Không paste secrets** vào chat, log, hoặc git
2. **Không push `main`** khi chưa migration xong
3. **Không sửa DB** — UI tests chỉ dùng mock; CRUD/search/role E2E chờ DB test cô lập.
4. **Không xóa file** chưa được confirm
5. **Không dùng tài khoản thật** hoặc mật khẩu ví dụ trong E2E

---

## 📞 KHI CẦN HỖ TRỢ

Nếu vướng sự cố:
1. Ghi vào `docs/CHANGELOG-2026-11-12.md` section "TASK VẤN SỰ CỐ"
2. Mô tả lỗi + đã thử gì
3. Không xóa thông tin cũ
