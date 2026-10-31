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
