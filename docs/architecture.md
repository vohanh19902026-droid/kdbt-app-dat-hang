# Kiến trúc

## Mục tiêu
Một Next.js web app responsive dùng chung trên desktop và điện thoại. Nhân viên kinh doanh tạo booking; kế hoạch xác nhận, xếp giờ, gán xe; Admin quản lý tài khoản. Điện thoại có thể cài PWA. Kế toán/Admin có sổ ghi khoản phải thu và thu tiền cơ bản.

## Stack
- Next.js App Router trên Vercel.
- Better Auth cho email/mật khẩu và session; signup công khai tắt.
- Drizzle ORM + PostgreSQL trên Neon; sequence ở database cấp mã booking không trùng khi nhiều người tạo cùng lúc.
- Tabulator làm lưới kế hoạch kiểu spreadsheet; ExcelJS xuất `.xlsx` chuẩn.
- Zod xác thực payload API; vai trò được kiểm tra ở server/API.

## Luồng request
```text
Mobile/Desktop Browser
        │
        ├─ Next.js pages / PWA shell
        ├─ Better Auth session ──┐
        └─ API routes            │
              │                 │
              └── RBAC + Zod ───┴── Drizzle ── Neon PostgreSQL
                                   ├─ orders / booking sequence
                                   ├─ customers / materials
                                   ├─ order_events audit trail
                                   ├─ receivable_entries append-only ledger
                                   └─ Better Auth user/session/account
```

## Ranh giới triển khai
- Pages/middleware không thay thế bảo vệ API: API tự xác minh session, vai trò và trạng thái tài khoản.
- Kinh doanh chỉ đọc booking do mình tạo; Kế hoạch/Admin thao tác toàn bộ lệnh.
- Bảng kế hoạch, báo cáo và tệp XLSX lọc theo ngày cấp hàng `COALESCE(planned_start_at, requested_at)`; đơn chưa xếp lịch nằm ở ngày yêu cầu.
- Mỗi cập nhật kế hoạch ghi audit event trong cùng transaction với đơn. Cột `version` ngăn cập nhật đè lên phiên bản mới hơn; trình duyệt gửi version hiện tại khi lưu.
- Service worker chỉ dự phòng offline screen/icon, không cache trang riêng hoặc API.
- API ghi dữ liệu kiểm tra Origin; production bật CSP cùng các security header cơ bản, API trả `Cache-Control: no-store`.
- Auth endpoint sign-in/email giới hạn 5 lần/phút với storage in-memory mặc định; giới hạn tính theo instance serverless, nên cần shared storage nếu mở rộng quy mô.
- Sổ công nợ chỉ mở cho `ADMIN`/`ACCOUNTANT`; API tự xác thực session/RBAC/Origin, số tiền là integer VND, bút toán append-only. Backend errors log JSON đã lược thông tin nhạy cảm.
- Chưa lưu giá bê tông, tự động lập phải thu từ đơn hàng, hóa đơn hoặc khối lượng giao từng chuyến.

## Triển khai
Cấu hình `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`; chạy schema SQL/Drizzle push một lần trên database trống; tạo Admin; deploy Next.js lên Vercel. Xem `README.md`.
