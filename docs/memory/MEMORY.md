# MEMORY — Quyết định lâu dài (append-only)

> Giới hạn: 80 dòng. Đạt giới hạn → gộp mục cũ xuống `archive/`.

## 2026-10-31

- Quyết định: Kế hoạch được phép dời ngày qua `plannedDate` (YYYY-MM-DD), server tính lại `planned_start_at`/`planned_end_at` bằng `resolvePlanningTimes`.
- Lý do: trước đây chỉ sửa được giờ trên ngày yêu cầu, không dời được ngày cấp hàng — thiếu nghiệp vụ điều phối.
- Tác động: API PATCH `orders/[id]` nhận thêm `plannedDate`; UI lưới có cột NGÀY; audit ghi `plannedDate` + thời điểm thay đổi.

## 2026-10-31

- Quyết định: Bảng kế hoạch, báo cáo và file XLSX lọc theo `COALESCE(planned_start_at, requested_at)`.
- Lý do: đơn đã dời ngày phải nằm đúng ngày cấp hàng; đơn chưa xếp lịch vẫn hiện theo ngày yêu cầu để không thất lạc.
- Tác động: trang `/orders?view=planning`, `/reports`, `/api/exports/xlsx` dùng cùng quy tắc ngày.

## 2026-10-31

- Quyết định: Chống ghi đè bằng `version` do client gửi lên; lệch phiên bản trả 409.
- Lý do: kiểm tra version phía server cũ đọc lại bản mới mỗi request nên hai người sửa tuần tự vẫn ghi đè nhau.
- Tác động: Tabulator gửi `version` mỗi lần lưu và cập nhật lại version sau khi thành công.

## 2026-10-31

- Quyết định: Thêm security headers, CSP production, `no-store` cho API và chặn Origin lạ trên API ghi dữ liệu.
- Lý do: OWASP cơ bản cho ứng dụng nội bộ dùng cookie session; giảm clickjacking, MIME sniffing và CSRF.
- Tác động: `next.config.ts`, `src/lib/request-guard.ts`; API POST/PATCH kiểm tra Origin trước khi xử lý.

## 2026-11-02

- Quyết định: Nạp `tabulator-tables` bằng `await import()` bên trong `useEffect`, không import tĩnh ở đầu component.
- Lý do: module Tabulator gọi `document.createElement` ngay khi được đánh giá khiến SSR `/orders` ném `ReferenceError: document is not defined` và trả HTTP 500.
- Tác động: `src/components/orders-workspace.tsx`; grid khởi tạo sau khi mount, có cờ `disposed` + `destroy()` khi unmount.

## 2026-11-02

- Quyết định: Thêm `GET /api/health` trả `{status, database}`; 503 khi DB mất kết nối, không lộ chuỗi kết nối.
- Lý do: cần đầu kiểm tra tự động sau deploy và cho uptime monitor.
- Tác động: `src/app/api/health/route.ts`, `force-dynamic`, `no-store`.

## 2026-11-02

- Quyết định: Lịch sử thay đổi booking hiển thị qua `GET /api/orders/[id]/events` + modal trong lưới; SALES chỉ xem đơn do mình tạo.
- Lý do: dữ liệu `order_events` đã ghi nhưng chưa có nơi tra cứu, thiếu khả năng kiểm toán khi nhiều người cùng sửa.
- Tác động: API mới, `orders-workspace.tsx`, CSS `.history-*`; sự kiện `ORDER_CREATED`/`ORDER_UPDATED`/trạng thái được dịch nhãn phía client.

## 2026-11-02

- Quyết định: Better Auth bắt buộc header `Origin` khớp `BETTER_AUTH_URL` cho `sign-in/email`; client phải gửi Origin (browser tự gửi).
- Lý do: thiếu Origin trả 403 `MISSING_OR_NULL_ORIGIN`; đây là chống CSRF mặc định.
- Tác động: test E2E phải đặt `origin: BASE`; preview deployment khác domain sẽ không đăng nhập được cho tới khi thêm domain vào `trustedOrigins`.

## 2026-11-02

- Quyết định: Báo cáo sản lượng lọc theo khoảng `from`/`to`, tối đa 92 ngày, dùng `clampIsoDateRange`; bỏ lọc `createdBy` sai dành cho ACCOUNTANT.
- Lý do: báo cáo một ngày không đủ cho tổng kết tuần/tháng; vai trò kế toán không tạo booking nên lọc theo người tạo luôn ra rỗng.
- Tác động: `reports/page.tsx`, `vn-date.ts` (`addIsoDays`, `clampIsoDateRange`), 2 unit test mới; trang vẫn chặn SALES.
