# Lộ trình triển khai

## Đã hoàn thành trong MVP

1. Next.js + Better Auth + Drizzle/PostgreSQL, deploy Vercel + Neon.
2. Đăng nhập nội bộ, khởi tạo Admin, quản lý tài khoản và vai trò Admin/Kế hoạch/Kinh doanh/Kế toán.
3. Tạo booking trên mobile, mã booking tự tăng trong PostgreSQL, dữ liệu NVKD giới hạn theo người tạo.
4. Bảng kế hoạch Tabulator chỉnh ngày/giờ, thông tin đơn, vật liệu, phương tiện và trạng thái; audit và phát hiện xung đột cập nhật.
5. Xuất XLSX có định dạng, bộ lọc, tổng khối lượng và thiết lập in ngang A3.
6. PWA cài đặt được; service worker chỉ lưu vỏ offline, không cache dữ liệu riêng.
7. Health check, error/loading boundary, lịch sử booking, báo cáo nhiều ngày và đổi mật khẩu tự phục vụ.

## P1/P2 vừa hoàn thiện trong workspace

- Better Auth giới hạn endpoint đăng nhập ở 5 lần/phút; bộ đếm mặc định lưu trong bộ nhớ từng instance.
- Backend log lỗi dạng JSON, chỉ gồm tên sự kiện/loại lỗi/request id; không ghi nội dung lỗi thô hay dữ liệu đăng nhập.
- Phân hệ công nợ: `ADMIN`/`ACCOUNTANT` xem số dư và ghi khoản phải thu/tiền thu, VND số nguyên, gắn khách hàng/booking/chứng từ, lọc ngày tối đa 92 ngày.
- Kế toán xuất XLSX sổ công nợ theo khoảng ngày đã lọc; file gồm tổng kỳ, số dư khách hàng và giao dịch chi tiết. Chỉ `ADMIN`/`ACCOUNTANT` được xuất.
- Sổ append-only: không sửa/xóa giao dịch; điều chỉnh bằng khoản đối ứng. Không tự suy ra doanh thu từ khối lượng, không lập hóa đơn hay thay thế phần mềm kế toán.
- Các migration hiện hành: `drizzle/0000`–`0004` (schema ban đầu, chỉ mục lịch, sổ công nợ, thiết lập/hồ sơ nhân viên và gán NVKD phụ trách khách hàng).

## Kiểm tra local

- `npm run typecheck` — đạt.
- `npm run lint` — đạt.
- `npm test` — 32/32 đạt, có kiểm tra workbook công nợ mở lại được.
- `npm run build` — đạt.
- `npm audit` — 0 vulnerabilities sau khi pin phiên bản vá tương thích cho `esbuild`, `minimatch` và `uuid`; giữ nguyên `exceljs@4.4.0`.
- Kiểm tra lại trong phiên hiện tại: typecheck, lint, build và 32/32 bài test đều đạt; migration dry-run trên PostgreSQL thử nghiệm `cencom_accounting_test` chỉ đọc và báo các migration `0000`–`0004` đã áp dụng.
- Migration `0002` đã chạy thành công trên PostgreSQL thử nghiệm cô lập; tích hợp ghi khoản phải thu/thu tiền, tổng theo kỳ, số dư và danh sách giao dịch đều đạt.
- Demo PostgreSQL cô lập có 12 booking mẫu; đã tạo thêm booking qua sequence, xếp lịch/gán xe, ghi audit và mở lại XLSX để xác nhận có mã booking/phương tiện. Bản ghi demo phát sinh được dọn sau kiểm tra.
- Smoke browser/API trên Next production build chạy local tại cổng 3100: 16/16 đạt (login, tạo/xếp booking, stale version, audit events, XLSX, Origin/RBAC, render các trang); booking và khách `SMOKE-` đã dọn, 12 booking mẫu còn lại để xem giao diện.
- UAT trực tiếp qua giao diện ngày 02/11/2026: tạo ba user local theo vai trò Kinh doanh/Kế hoạch/Kế toán, chạy booking → điều phối → công nợ → xuất hai file XLSX; quyền xuất chéo bị chặn 403. Kịch bản và bằng chứng tại [uat-scenarios.md](uat-scenarios.md). Tài khoản, booking và sổ UAT được giữ trong database thử nghiệm local.
- UAT phát hiện và sửa callback `cellClick` của Tabulator khiến lịch sử booking không mở; đã xác nhận lại trên UI. Đưa `nextCookies()` về cuối danh sách plugin Better Auth để loại cảnh báo thứ tự.

## Bước triển khai còn lại

- GitHub ghi nhận Vercel check của commit `cd8c475` là `failure`; deployment hiện hành và log build chưa được xác minh.
- Khi truy cập được đúng project Vercel, kiểm tra log deploy và biến môi trường, xác nhận trạng thái từng migration trên đúng Neon database, rồi mới triển khai lại.
- Sau deploy, chạy smoke test API/frontend với tài khoản `ADMIN` và `ACCOUNTANT`, thử ghi hai giao dịch đối ứng, kiểm tra phép tính số dư và quyền `PLANNER`/`SALES` bị chặn.
- Admin tạo tài khoản NV kế hoạch/NVKD và nhân viên diễn tập booking → xếp lịch → xuất XLSX trên thiết bị thật.
- Đối chiếu cột/màu/độ rộng XLSX với workbook gốc; hiện chỉ có ảnh tham khảo. Xác nhận backup/restore Neon.

## Phạm vi giai đoạn sau

- Hóa đơn, đối soát thuế, phân bổ một khoản thu cho nhiều hóa đơn và quy trình duyệt/xóa bút toán.
- Phiếu giao theo chuyến, gán tài xế, cập nhật khối lượng thực đổ.
- Realtime push, cấu hình danh mục từ UI, nhập booking hàng loạt và dashboard nhiều trạm.
