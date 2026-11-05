# Đánh giá dữ liệu bê tông cho Giai đoạn 2

Ngày rà soát: 05/11/2026  
Phạm vi: báo cáo bán hàng và công nợ năm 2026, tháng 01–09; chỉ đọc, không sửa workbook nguồn.

## Kết luận

Có thể đưa dữ liệu vào hệ thống, nhưng không nên nhập trực tiếp các hàng trong workbook thành khách hàng, giao dịch bán hàng hoặc bút toán công nợ. Đây là báo cáo tháng có nhóm, dòng tổng, số dư chuyển kỳ, công thức và ô gộp. Cần dựng một kho staging có lineage, xuất XLSX để người phụ trách kế toán/kinh doanh thẩm tra, rồi mới chốt quy tắc đối chiếu và nhập dữ liệu đã duyệt vào PostgreSQL của ứng dụng.

Đề xuất **SQLite làm kho staging cục bộ** và **XLSX làm hồ sơ thẩm tra**. CSV chỉ phù hợp làm bản trao đổi từng bảng sau khi dữ liệu đã chuẩn hóa; CSV không đủ biểu diễn quan hệ, công thức, trạng thái duyệt và lịch sử nguồn.

## Nguồn và cách đọc

- Thư mục nguồn: `E:\1. CENCOM 2026\1. BÁO CÁO ĐƠN VỊ\1. BÁO CÁO CÔNG NỢ\CÔNG NỢ NĂM 2026\NĂM 2026`.
- Có 9 workbook tháng 01–09/2026. Bỏ qua file tạm Excel bắt đầu bằng `~$`.
- Tên sheet thực tế là `PKDBT- DA` (dự án) và `PKDBT DC` (dân cư), không trùng tên rút gọn `PKDBT_DA`/`PKDBT_DC`.
- Các file có thành phần drawing lỗi `xl/drawings/NULL`; thư viện `openpyxl` không mở được một số file. Rà soát cấu trúc được thực hiện bằng cách đọc XML bên trong XLSX dạng ZIP, không sửa nguồn.
- Hàng có dữ liệu gồm tiêu đề, nhóm nhân viên/vùng, tổng phụ, số dư chuyển kỳ và dòng giao hàng; **không phải số giao dịch**.

| Tháng 2026 | Hàng có dữ liệu DA | Hàng có dữ liệu DC |
|---|---:|---:|
| 01 | 582 | 1.561 |
| 02 | 436 | 960 |
| 03 | 505 | 1.304 |
| 04 | 572 | 1.747 |
| 05 | 543 | 1.405 |
| 06 | 530 | 1.397 |
| 07 | 554 | 1.255 |
| 08 | 499 | 1.111 |
| 09 | 520 | 894 |

## Ánh xạ trường cần giữ

### Dự án — `PKDBT- DA`

| Cột nguồn thường gặp | Ý nghĩa cần lưu |
|---|---|
| C–D | Khách hàng; dự án/cấp dự án |
| E–G | Điều khoản thanh toán: bảo lãnh, thanh toán 100%, nợ |
| H–I | Mã đơn vị; dư nợ đầu kỳ |
| J–L | Ngày đổ; mác bê tông; độ sụt |
| M–O | Bê tông: khối lượng, đơn giá, thành tiền |
| P–R | Bơm: khối lượng, đơn giá, thành tiền |
| S–T | Vận chuyển; tổng khối lượng |
| U–X | Doanh thu; tổng doanh thu; thanh toán; dư nợ cuối kỳ |
| Y–AA | Ghi chú/hợp đồng/kế hoạch thanh toán và đối chiếu công nợ |
| AB trở đi | Ma trận công nợ theo kỳ lịch sử; không phải dòng bán hàng |

### Dân cư — `PKDBT DC`

| Cột nguồn thường gặp | Ý nghĩa cần lưu |
|---|---|
| A–C | Vùng; mã/nhóm; thứ tự |
| D–G | Khách hàng; địa chỉ; điện thoại; thông tin hóa đơn |
| H | Dư nợ đầu kỳ; ngày ghi trên tiêu đề thay đổi hoặc có thể cũ |
| I–K | Ngày cấp; mác bê tông; độ sụt |
| L–N | Bê tông: khối lượng, đơn giá, thành tiền |
| O–Q | Bơm: khối lượng, đơn giá, thành tiền |
| R–T | Vận chuyển; loại bơm hoặc thuế theo phiên bản; hạng mục |
| U–Y | Doanh thu; tổng doanh thu; thanh toán/chuyển khoản; dư nợ cuối kỳ |
| Z trở đi | Ghi chú, UNC/XHĐ hoặc cột theo dõi khác tùy tháng |

Các vị trí tiêu đề và một số ý nghĩa cột thay đổi theo tháng. Bộ nhập phải dò header theo nhãn, lưu phiên bản mapping theo workbook và đánh dấu trường chưa chắc chắn thay vì cố định một số dòng/cột cho cả năm.

## Mô hình dữ liệu staging đề xuất

- `source_file`: đường dẫn/tên file, SHA-256, kỳ báo cáo, thời điểm file, phiên bản bộ nhập.
- `source_sheet`: tên sheet gốc, loại sheet DA/DC và vị trí header đã phát hiện.
- `source_row`/`source_cell`: workbook, sheet, số dòng, loại dòng, địa chỉ ô, nhãn gốc, giá trị cache và công thức gốc.
- `customer` + `customer_source_map`: UUID nội bộ, phân khúc dân cư/dự án, mã nguồn, trạng thái xác minh. Lưu PII hạn chế quyền truy cập.
- `project`: công trình, khách hàng liên quan, điều khoản thanh toán và nguồn.
- `delivery_line`: ngày cấp, mác, độ sụt, khối lượng/đơn giá/thành tiền bê tông, bơm, vận chuyển, thuế, hạng mục, ghi chú.
- `debt_snapshot`: kỳ báo cáo, dư đầu kỳ, doanh thu, thanh toán, dư cuối kỳ, các bucket tuổi nợ và địa chỉ ô nguồn.
- `review_issue`/`reconciliation`: nghi vấn mapping, chênh lệch tổng và quyết định của người thẩm tra.

Dùng UUID sinh trong app; khóa nguồn giữ nguyên file + sheet + hàng. Mã đơn vị bên DA hữu ích để đối chiếu nhưng chưa đủ làm khóa duy nhất. Sheet DC chưa có mã khách hàng duy nhất rõ ràng; không tự gộp hồ sơ dựa vào tên, địa chỉ hoặc số điện thoại.

Giữ riêng ô trống, số 0, dấu gạch và giá trị âm. Không dùng số thực nhị phân cho tiền; dùng số nguyên đồng hoặc Decimal. Không tính lại công thức tham chiếu workbook ngoài; lưu công thức, giá trị cache và trạng thái kiểm tra.

## Kiểm soát trước khi chuyển sang ứng dụng

1. Phân loại từng hàng: tiêu đề, vùng/nhân viên, khách hàng/dự án, dòng cấp bê tông, tổng, chuyển kỳ, điều chỉnh hoặc trống.
2. So dư nợ cuối kỳ khách hàng với dư đầu kỳ tháng kế tiếp; ghi chênh lệch, không tự cân chỉnh.
3. Đối chiếu khối lượng/doanh thu bê tông, bơm, vận chuyển từ dòng chi tiết với tổng nhóm và tổng tháng.
4. Đối chiếu thanh toán/chuyển khoản với biến động số dư; báo cáo hiện tại là snapshot, chưa chứng minh sổ thu đầy đủ theo từng chứng từ.
5. Kiểm tra công thức và cache, đặc biệt DA tháng 03 chỉ có 4 công thức trong khi DA các tháng khác có khoảng 900–1.142 công thức.
6. Phê duyệt crosswalk khách hàng/dự án và quy tắc khử trùng trước khi nhập. Các workbook liên kết số liệu tháng trước; nối tất cả tháng có thể nhân đôi giao dịch và không thấy mã phiếu giao hàng duy nhất rõ ràng.
7. Sau khi duyệt, chuyển các bản ghi cần dùng sang PostgreSQL qua migration/import có kiểm tra tổng trước-sau. Không dùng Production làm nơi staging hay thẩm tra.

## XLSX thẩm tra cần tạo ở bước trích xuất

Các tab đề xuất: `Hướng dẫn`, `Tổng đối soát`, `Khách hàng`, `Dự án`, `Dòng bán hàng`, `Snapshot công nợ`, `Cần xử lý`, `Ánh xạ nguồn`, `Đối chiếu công thức`. Mỗi dòng chi tiết mang `source_file`, `sheet`, `row`, `cell_range`, `formula`, `cached_value`, `import_version` và `review_status`. Workbook nguồn giữ nguyên; XLSX kiểm tra là bản mới có thể tái tạo.

Lệnh tái tạo nên được đóng gói thành script có tham số `--source-dir`, `--output-dir`, `--from-month`, `--to-month` và `--mode review`; log manifest lưu SHA-256 từng file, thời gian chạy, số dòng mỗi loại và phiên bản schema. **Chưa tạo script, SQLite hay XLSX trích xuất trong lượt đánh giá này** vì cần xử lý layout theo tháng và duyệt quy tắc phân loại trước để tránh tạo số liệu sai.

## Việc còn lại cho Giai đoạn 2

1. Người phụ trách kế toán/kinh doanh xác nhận ý nghĩa các cột thay đổi theo tháng, công thức DA tháng 03 và cách phân biệt dòng điều chỉnh với giao hàng.
2. Xây parser XML an toàn cho 9 workbook và ghi dữ liệu raw vào SQLite staging.
3. Sinh XLSX thẩm tra, giải quyết các `review_issue` và ký xác nhận tổng đối soát.
4. Thiết kế migration PostgreSQL/import chỉ cho các dữ liệu được duyệt; giữ dữ liệu gốc và khả năng truy ngược.
