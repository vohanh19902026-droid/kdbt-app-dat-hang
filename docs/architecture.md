# Kiến trúc

## Mục tiêu
Một Next.js web app responsive dùng chung trên desktop và điện thoại. Nhân viên kinh doanh tạo booking; kế hoạch xác nhận, xếp giờ, gán xe; Admin quản lý tài khoản. Điện thoại có thể cài PWA. Kế toán được để chỗ cho giai đoạn sau.

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
                                   └─ Better Auth user/session/account
```

## Ranh giới triển khai
- Pages/middleware không thay thế bảo vệ API: API tự xác minh session, vai trò và trạng thái tài khoản.
- Kinh doanh chỉ đọc booking do mình tạo; Kế hoạch/Admin thao tác toàn bộ lệnh.
- Mỗi cập nhật kế hoạch ghi audit event trong cùng transaction với đơn. Cột `version` ngăn cập nhật đè lên phiên bản mới hơn.
- Service worker chỉ dự phòng offline screen/icon, không cache trang riêng hoặc API.
- Không lưu tiền, công nợ hay khối lượng giao thực tế theo từng chuyến trong MVP.

## Triển khai
Cấu hình `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`; chạy schema SQL/Drizzle push một lần trên database trống; tạo Admin; deploy Next.js lên Vercel. Xem `README.md`.