# Mô hình dữ liệu

| Bảng | Vai trò |
|---|---|
| `user` | Better Auth user, vai trò nghiệp vụ `app_role`, bật/tắt tài khoản |
| `session`, `account`, `verification` | Session, tài khoản đăng nhập mật khẩu và xác minh Better Auth |
| `customers` | Danh mục khách tạo/cập nhật cùng lúc phát sinh booking |
| `orders` | Booking, thông tin công trình, yêu cầu cấp, lịch đã xếp, vật liệu, xe bơm/xe chở, số lượng và trạng thái |
| `order_events` | Nhật ký ai đổi trường nào và thời điểm nào |
| `materials` | Danh mục vật liệu dự trữ cho cấu hình mở rộng |
| `booking_number_seq` | Cấp mã `BOOK-7431`, `BOOK-7432`… nguyên tử tại PostgreSQL |

## Quy tắc
- `orders.id` là UUID nội bộ; `booking_no` là mã nhìn thấy, unique và không tái sử dụng.
- `requested_at` là giờ NVKD yêu cầu; `planned_start_at`/`planned_end_at` là thời gian kế hoạch xác nhận.
- Khối lượng đặt và thực đổ là `numeric(10,2)`; xe/chuyến hỗ trợ 5, 7, 10 m³ và có thể nhập danh mục khác từ lưới.
- Trạng thái: `PENDING → APPROVED → SCHEDULED → IN_PROGRESS → COMPLETED`; có thể hủy trước khi bắt đầu.
- Kế hoạch cập nhật audit và dữ liệu booking trong transaction; `version` kiểm tra ghi đồng thời.
- Xóa khách hàng không xóa booking; xóa user bị ràng buộc bởi lịch sử tạo đơn.

## Giai đoạn sau
Thêm từng chuyến xe, phiếu giao, khối lượng đối soát, hóa đơn và khoản thu để làm công nợ; không gộp số liệu đó vào `actual_m3` hiện tại.