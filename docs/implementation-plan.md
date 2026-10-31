# Lộ trình triển khai

## Đã dựng cho bản MVP
1. Nền Next.js/Better Auth/Drizzle/PostgreSQL theo giấy phép MIT, cấu hình deploy Vercel/Neon.
2. Đăng nhập nội bộ, khởi tạo Admin, quản lý tài khoản và vai trò Admin/Kế hoạch/Kinh doanh/Kế toán.
3. Tạo booking mobile, số booking database sequence, lọc theo ngày và giới hạn dữ liệu NVKD theo người tạo.
4. Lưới kế hoạch Tabulator chỉnh trực tiếp giờ, thông tin đơn, vật liệu, phương tiện, trạng thái; lưu audit và xử lý ghi đồng thời.
5. Export XLSX có định dạng, bộ lọc, công thức tổng và thiết lập in.
6. PWA manifest, icon, offline fallback không lưu dữ liệu riêng.

## Đã bổ sung sau MVP (2026-10-31)
- Dời ngày cấp hàng trên lưới kế hoạch; giữ nguyên giờ khi đổi ngày.
- Lọc bảng kế hoạch, báo cáo và XLSX theo ngày cấp hàng, fallback ngày yêu cầu.
- Chống ghi đè bằng version do client gửi; API trả 409 khi phiên bản đã cũ.
- Validate ngày/giờ chặt ở API và trang; tham số ngày sai không còn làm trang 500.
- Security headers, CSP production, `no-store` cho API, chặn Origin lạ; index `orders_planning_basis_idx`.

## Trước khi dùng dữ liệu thật
- Cấu hình Neon/Vercel secrets và áp dụng `drizzle/0000_initial.sql` hoặc `db:push` lên database thử.
- Tạo Admin thật, tạo tài khoản từng nhân viên, xác nhận email/tên hiển thị và vai trò.
- Nạp dữ liệu mẫu chỉ trong database rỗng; diễn tập NVKD → kế hoạch → export với người dùng thực.
- Đối chiếu XLSX với file mẫu gốc, đặc biệt tên cột, màu, chiều rộng, trường bắt buộc và danh sách vật liệu/xe.
- Kiểm tra backup/restore và session/password policy trước khi chuyển sang vận hành.

## Chưa thuộc MVP
Công nợ, hóa đơn, phiếu giao theo chuyến, phân công tài xế cụ thể, realtime push, cấu hình danh mục từ UI, nhập đơn Excel và dashboard nhiều trạm.