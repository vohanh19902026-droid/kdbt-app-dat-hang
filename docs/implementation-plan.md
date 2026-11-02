# Lộ trình triển khai

## Đã hoàn thành cho bản MVP

1. Nền Next.js + Better Auth + Drizzle/PostgreSQL, deploy Vercel + Neon.
2. Đăng nhập nội bộ, khởi tạo Admin, quản lý tài khoản và vai trò Admin/Kế hoạch/Kinh doanh/Kế toán.
3. Tạo booking trên mobile, mã booking tự tăng trong PostgreSQL, dữ liệu NVKD được giới hạn theo người tạo.
4. Bảng kế hoạch Tabulator chỉnh trực tiếp ngày/giờ, thông tin đơn, vật liệu, phương tiện và trạng thái; ghi lịch sử, phát hiện xung đột cập nhật.
5. Xuất XLSX có định dạng, bộ lọc, tổng khối lượng và thiết lập in ngang A3.
6. PWA cài đặt được; service worker chỉ lưu vỏ offline, không cache dữ liệu riêng.
7. Bảo mật nền: CSP/headers, chặn Origin lạ cho API ghi, API `no-store`, rate limit đăng nhập theo cấu hình Better Auth.
8. Vận hành: migration có ghi nhận phiên bản, health check, màn hình lỗi/loading, lịch sử booking, báo cáo nhiều ngày và đổi mật khẩu tự phục vụ.

## Đã triển khai và kiểm tra ngày 2026-11-02

- Neon được provision, migration đã áp và tài khoản Admin đầu tiên đã tạo.
- Production deploy trên Vercel; health check trả trạng thái database `up`.
- Smoke test production ghi nhận 16/16 kiểm tra thành công; dữ liệu smoke đã được dọn.
- Kiểm tra mã nguồn local: typecheck, lint, 25/25 unit test và production build đều thành công.
- Nhánh `main` đồng bộ với `origin/main` tại commit `ac0d07b` khi tiếp nhận bàn giao.

## Việc cần hoàn tất trước khi đưa vào vận hành thường xuyên

- Admin đăng nhập, đổi mật khẩu khởi tạo sang mật khẩu riêng, rồi tạo tài khoản NV kế hoạch/NVKD và xác nhận vai trò.
- Diễn tập quy trình booking → xếp lịch → xuất XLSX trên điện thoại và desktop với nhân viên thực tế.
- Đối chiếu cột, màu, độ rộng và nội dung XLSX với workbook gốc; hiện mẫu được dựng theo ảnh tham khảo, chưa có file Excel nguồn để so khớp.
- Kiểm tra quy trình backup/restore Neon và thống nhất người phụ trách theo dõi uptime/health.

## Ngoài phạm vi MVP / giai đoạn tiếp theo

- Công nợ/kế toán, hóa đơn và đối soát.
- Phiếu giao theo chuyến, gán tài xế, cập nhật khối lượng thực đổ.
- Realtime push, cấu hình danh mục vật liệu/xe từ giao diện, nhập booking hàng loạt.
- Dashboard nhiều trạm và báo cáo quản trị nâng cao.
