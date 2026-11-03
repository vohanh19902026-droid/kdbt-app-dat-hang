# Kịch bản UAT — đặt hàng, kế hoạch và công nợ

## Phạm vi

- Chạy trên local `http://127.0.0.1:3100`, PostgreSQL thử nghiệm `cencom_accounting_test` tại `127.0.0.1:55432`.
- Dùng dữ liệu có tiền tố `UAT`; không ghi vào cơ sở dữ liệu Neon/production.
- Các giao dịch công nợ là sổ append-only. Dữ liệu UAT được giữ lại để người dùng tiếp tục kiểm tra.

## Tài khoản thử nghiệm

| Vai trò | Tài khoản |
| --- | --- |
| Admin | `demo-admin@local.invalid` (đã có sẵn trong database local) |
| Kinh doanh | `uat.sales@local.invalid` |
| Kế hoạch | `uat.planner@local.invalid` |
| Kế toán | `uat.accounting@local.invalid` |

Mật khẩu tạm chỉ được gửi trong báo cáo phiên, không lưu trong tài liệu hoặc repository.

## Kịch bản và tiêu chí đạt

### UAT-01 — Kinh doanh tạo đơn

1. Đăng nhập tài khoản Kinh doanh.
2. Tạo booking `UAT Công trình Tân Phú`, khối lượng 16,5 m³, mác 250 (12+2), cát vàng, đá 1x2, bơm 42m, xe 7 m³/chuyến, ngày 02/11/2026.
3. Xác nhận mã booking tự sinh và đơn xuất hiện trong danh sách riêng của nhân viên.

**Đạt khi:** UI hiển thị `BOOK-7445`, đúng thông tin đặt hàng và trạng thái chờ duyệt.

### UAT-02 — Kế hoạch duyệt và xếp xe

1. Đăng nhập tài khoản Kế hoạch, tìm `BOOK-7445`.
2. Sửa giờ cấp thành 14:45–16:00, gán `Xe bồn UAT 7m3`.
3. Duyệt từ “Chờ duyệt” sang “Đã xác nhận”, sau đó chuyển sang “Đã xếp lịch”.
4. Mở mã booking để xem lịch sử thay đổi.

**Đạt khi:** bảng hiển thị giờ, phương tiện và trạng thái đã xếp lịch; lịch sử ghi người thao tác và giá trị trước/sau. Luồng trạng thái chặn chuyển thẳng từ chờ duyệt sang đã xếp lịch.

### UAT-03 — Xuất kế hoạch XLSX

1. Ở vai trò Kế hoạch, xuất bảng cho ngày 02/11/2026.
2. Mở file bằng ExcelJS để kiểm tra cấu trúc và dữ liệu.

**Đạt khi:** workbook có sheet `Kế hoạch cấp`, 20 dòng, 22 cột; chứa `BOOK-7445`, phương tiện `Xe bồn UAT 7m3`, hai cột ghi chú, loại xe bơm, giờ yêu cầu và trạng thái.

### UAT-04 — Kế toán ghi công nợ và xuất sổ

1. Đăng nhập tài khoản Kế toán, chọn khách `UAT Công trình Tân Phú`.
2. Ghi phải thu 25.000.000₫, chứng từ `UAT-HD-2026-001`, gắn với `BOOK-7445`.
3. Ghi đã thu 10.000.000₫, phiếu thu `UAT-PT-2026-001`.
4. Xuất XLSX cho khoảng 01–02/11/2026 và mở lại workbook.

**Đạt khi:** UI và XLSX cùng thể hiện phải thu 25.000.000₫, đã thu 10.000.000₫, còn phải thu 15.000.000₫; workbook có khách hàng, booking và hai số chứng từ.

### UAT-05 — Phân quyền chéo

1. Vai trò Kế hoạch gọi đường dẫn xuất sổ công nợ.
2. Vai trò Kế toán gọi đường dẫn xuất bảng kế hoạch.

**Đạt khi:** cả hai thao tác bị từ chối HTTP 403 với thông báo quyền tương ứng.

## Kết quả chạy ngày 02/11/2026

| Kịch bản | Kết quả | Bằng chứng |
| --- | --- | --- |
| UAT-01 | Đạt | UI tạo booking `BOOK-7445`, hiện 16,5 m³ và trạng thái chờ duyệt. |
| UAT-02 | Đạt | Bảng kế hoạch và lịch sử ghi giờ 14:45–16:00, phương tiện, hai bước trạng thái. |
| UAT-03 | Đạt ở source hiện tại | Tạo workbook từ 13 booking của database UAT, mở lại bằng ExcelJS: sheet `Kế hoạch cấp`, 20 dòng, 22 cột, có `BOOK-7445` và các trường mới. File kiểm tra: `D:\Temp\kdbt-plan-uat-current-source.xlsx`. |
| UAT-04 | Đạt | UI: 25.000.000₫ / 10.000.000₫ / 15.000.000₫; XLSX `E:\Du lieu C\Downloads\so-cong-no-2026-11-01-den-2026-11-02.xlsx` mở lại thành công. |
| UAT-05 | Đạt | Kế hoạch xuất công nợ: 403; Kế toán xuất kế hoạch: 403. |

## Lỗi tìm thấy và đã sửa

- Bấm mã booking trước đây gây lỗi JavaScript do xử lý sai tham số `cellClick` của Tabulator; lịch sử không mở được. Đã chuyển xử lý vào callback cột theo chữ ký `(event, cell)`, bổ sung kiểu tương ứng, build lại và kiểm tra lịch sử thành công trên UI.
- Better Auth cảnh báo plugin `nextCookies` chưa đứng cuối danh sách. Đã đổi thứ tự plugin để loại bỏ cảnh báo cấu hình.

## Giới hạn của lần UAT

- Đây là UAT local với tài khoản và giao dịch mô phỏng; không chứng minh được cấu hình production/Neon hoặc tích hợp kế toán bên ngoài.
- Phiếu thu được ghi ở cấp khách hàng; liên kết booking là tùy chọn. Giao dịch sổ không sửa/xóa được theo thiết kế.
- Kết quả lint, typecheck, build và unit test được ghi ở báo cáo phiên; người dùng nên đổi các mật khẩu tạm trước khi dùng chung máy local.

## UAT bổ sung ngày 02/11/2026 — cài đặt Admin và giới hạn vai trò

| Kịch bản | Kết quả | Bằng chứng |
| --- | --- | --- |
| Kế toán xem sổ công nợ | Đạt | Trên UI local, `uat.accounting@local.invalid` thấy phải thu 25.000.000 ₫, đã thu 10.000.000 ₫, còn 15.000.000 ₫ và hai giao dịch của khách UAT. |
| Kế toán gọi API xuất bảng kế hoạch | Đạt | UI điều hướng trực tiếp tới `/api/exports/xlsx?date=2026-11-02` trả JSON từ chối quyền. |
| Kế toán vào Settings Admin | Đạt sau sửa | Phát hiện route Settings chuyển kế toán về `/orders`, nơi server page chưa chặn vai trò dù API đã chặn. Đã thêm guard và xác nhận kế toán được chuyển về `/accounting?denied=1`, không còn thấy danh sách booking. |
| Kiểm tra trực quan trang công nợ | Đạt | Trang đã tải hoàn chỉnh sau khi khởi động lại Next production local; ảnh chụp trong phiên thể hiện tổng số liệu và form công nợ. |

Không lưu lại thay đổi cài đặt trong lượt UAT này. Database dùng là PostgreSQL local ở cổng 55432.

## Ghi chú lịch sử về môi trường UAT local

- UAT local dùng PostgreSQL riêng tại `127.0.0.1:55432`; không dùng Neon production.
- Trong lần kiểm tra local ngày 02/11/2026, tiến trình cũ ở cổng 3100 còn phục vụ build trước và tạo XLSX 18 cột, trong khi source lúc đó tạo 22 cột. Đây là ghi nhận của lần kiểm tra đó, không phải trạng thái hiện tại của production.

## UAT đăng nhập và phân quyền trên production ngày 03/11/2026

Ba tài khoản UAT được tạo trên production sau khi chủ tài khoản xác nhận; mật khẩu tạm chỉ được trao trong phiên làm việc, không lưu tại đây.

| Vai trò | Tài khoản | Kết quả kiểm tra |
| --- | --- | --- |
| Kinh doanh | `uat.sales@cencom.vn` | Đăng nhập thành công; thấy màn hình đặt booking, không thấy bảng kế hoạch/quản trị; danh sách chỉ hiển thị booking của tài khoản. |
| Kế hoạch | `uat.planner@cencom.vn` | Đăng nhập thành công; thấy bảng kế hoạch và nút xuất XLSX; bị chuyển hướng khi mở màn hình công nợ. |
| Kế toán | `uat.accounting@cencom.vn` | Đăng nhập thành công; thấy sổ công nợ và liên kết xuất XLSX; không được truy cập đơn hàng. Sổ chưa có bút toán, không ghi dữ liệu công nợ thử nghiệm lên production. |

Booking `BOOK-7431` / khách `SMOKE-1793673251102` là bản ghi smoke test production có từ lần kiểm tra trước; đã chuyển sang trạng thái Đã hủy và được giữ lại để bảo toàn lịch sử. Sau khi nạp dữ liệu thật, Admin cần khóa tài khoản `uat.*` và làm sạch/ẩn bản ghi smoke theo chính sách lưu trữ đã thống nhất.

## Xác nhận production ngày 02/11/2026

- Nhánh GitHub `main` tự triển khai Vercel; deployment production mới nhất đã Ready.
- `/api/health` trả `status: ok`, `database: up`.
- Trên giao diện Admin production đã xác nhận tab danh mục hoạt động; form booking hiển thị mác, cát/đá, bơm, dung tích xe và hạng mục lấy từ cấu hình. Không gửi booking thử vào production.
- Database production chưa có dữ liệu nhân viên, khách hàng hoặc booking thử. Dùng dữ liệu thật khi bắt đầu vận hành.
