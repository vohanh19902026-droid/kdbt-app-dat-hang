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
5. Kiểm tra công thức và cache theo XML nguồn. Kiểm kê chỉ đọc ngày 06/11/2026 ghi nhận DA tháng 03 có 4/4 ô công thức có cached value, 0 ô lỗi; các tháng DA khác có 1.930–2.508 công thức mỗi sheet. Con số 900–1.142 nêu trong bản đánh giá trước không cùng phạm vi đếm và được rút lại. Cache có mặt không chứng minh công thức đúng nghiệp vụ.
6. Phê duyệt crosswalk khách hàng/dự án và quy tắc khử trùng trước khi nhập. Các workbook liên kết số liệu tháng trước; nối tất cả tháng có thể nhân đôi giao dịch và không thấy mã phiếu giao hàng duy nhất rõ ràng.
7. Sau khi duyệt, chuyển các bản ghi cần dùng sang PostgreSQL qua migration/import có kiểm tra tổng trước-sau. Không dùng Production làm nơi staging hay thẩm tra.

## Trạng thái trích xuất và hồ sơ thẩm tra

Đã tạo kho SQLite raw và kho SQLite chuẩn hóa ứng viên trong thư mục riêng `_review_private` cạnh các workbook nguồn. Cả hai kho chỉ phục vụ thẩm tra; chưa nhập dữ liệu vào app, Preview hay Production. Workbook nguồn không bị sửa.

Workbook thẩm tra hiện hành gồm 8 tab `Guide`, `Control summary`, `Business questions`, `Roster`, `Roster evidence`, `Customer balances`, `Carry-forward exceptions` và `Review issues`. Workbook có bộ lọc, cố định hàng tiêu đề và giữ tên workbook, SHA-256, sheet, hàng/ô hoặc vùng nguồn. Tab `Business questions` có 15 câu hỏi cụ thể về đơn vị tiền, công thức công nợ, thu tiền, loại dòng, trùng giao dịch, công thức DA tháng 03, header DC, khóa khách hàng/dự án, lệch/chưa ghép chuyển kỳ, roster NVKD và giá. Trạng thái ban đầu đều là `CHỜ`; các trường kết luận, người xác nhận, ngày, căn cứ và ghi chú được để trống. Tab `Control summary` hiển thị số liệu staging cùng giới hạn diễn giải; đây là số tĩnh từ staging, không phải bảng cân đối tự tính và không phải số đã duyệt. Chi tiết 15.123 dòng hoạt động vẫn nằm trong SQLite và `activity-candidates.csv`; không xem tất cả là phiếu giao hàng cho tới khi rà loại dòng.

Bản XLSX hiện hành nằm ngoài repo trong `_review_private\outputs\01a1a100-147b-7a12-a58d-c96631e35580\cencom-2026-01_09-human-review.xlsx`. Kiểm tra ngày 06/11/2026 bằng Artifact Tool xác nhận đủ 8 sheet; 15 câu hỏi đều `CHỜ`; mọi trường nhập quyết định/người duyệt/ngày/căn cứ ở 4 tab roster, số dư, chuyển kỳ và review issues vẫn trống. XML của workbook có 0 công thức và 0 ô lỗi công thức. Thư mục output kế thừa ACL chỉ cấp FullControl cho `HANHVO\Admin`. Workbook nguồn và staging chưa bị nhập vào app hoặc database.

Roster NVKD được xác định **chỉ từ ô tên có tô vàng** trong hai sheet `PKDBT- DA` và `PKDBT DC` của 9 workbook tháng 01–09/2026. Ô tên được đối chiếu trực tiếp theo màu nền Excel theme accent 6; dấu `TT`, tên trên sheet khác và các dải màu ở cột khác không phải tiêu chí chọn NVKD. Rà soát ô nguồn xác nhận 216 quan sát màu vàng, thuộc 22 tên ứng viên (7 DA, 15 DC); 18 ô nhãn loại trừ màu vàng được giữ riêng và loại khỏi roster. Tên/email chưa được xác minh để tạo tài khoản. Các CSV roster cũ có 21 ứng viên/207 dòng chứng cứ đã được ghi rõ là bản lịch sử trong `README-roster-correction.txt`; không dùng để tạo tài khoản. `sales-roster-excluded-groups.csv` là bản tổng hợp hợp lệ của 2 nhãn nhóm, nhưng không thay thế 18 dòng chứng cứ trong corrected JSON/XLSX.

Kiểm kê nguồn chỉ đọc được thực hiện ngày 06/11/2026 bằng `_review_private\inventory_source_workbooks.py`; manifest `source-workbook-inventory.json` giữ tên file, kích thước, modified UTC và SHA-256 của 9 workbook cùng số công thức/cache/lỗi cho đúng hai sheet. Tổng DA là 18.841 công thức, toàn bộ có cached value, 0 ô lỗi; tổng DC là 61.406, toàn bộ có cached value, 0 ô lỗi. Riêng DA tháng 03 có 4 công thức/4 cache/0 lỗi; các tháng DA còn lại có 1.930–2.508 công thức. Số cũ 900–1.142 không cùng phạm vi đếm và đã được rút khỏi kết luận. Cache hiện diện không xác minh tính đúng của công thức hay số liệu.

Đối chiếu XML gốc với SQLite raw phát hiện `openpyxl` đã bỏ qua ba công thức nằm trong ô phụ của các vùng gộp ở DC tháng 03/06 (V238, V1086, U1130). Extractor riêng đã được sửa để giữ nguyên công thức và cached value từ XML, biểu diễn số cache bằng Decimal; sau khi tái tạo, đối chiếu XML↔SQLite cho 18 sheet không còn ô công thức thiếu, `PRAGMA integrity_check` trả `ok`. Rollup ứng viên trước/sau không đổi: 8.243 quan sát, 15.123 hoạt động, 2.069 cờ; chuyển kỳ 1.172 khớp/26 lệch/725 mơ hồ. Workbook review đã được dựng lại, Q06 dùng đúng phạm vi 1.930–2.508; kiểm tra cấu trúc xác nhận 8 sheet, 15 câu hỏi `CHỜ`, không có công thức/lỗi, toàn bộ 57.450 ô nhập quyết định còn trống. Đây là xác nhận kỹ thuật, không thay thế việc duyệt nghiệp vụ.

Kết quả staging: 8.243 quan sát khách hàng/dự án theo tháng (không phải số khách hàng duy nhất), 4.411 khóa tổ hợp ứng viên, 103 ứng viên dự án/799 quan sát dự án và 15.123 dòng hoạt động ứng viên. Cân đối cùng kỳ có 230 dòng khớp và 8.013 thiếu đầu vào số; đối chiếu chuyển kỳ có 1.172 khớp, 26 lệch và 725 chưa ghép chắc chắn. Có 995 khóa lặp trong tháng, 397 tên gắn với nhiều khóa và 632 khóa yếu chỉ dựa trên tên. Các mục này cần rà soát người dùng, không được tự gộp hay cân chỉnh.

Tái tạo ở thư mục riêng theo thứ tự: `extract_concrete_staging.py`, `normalize_concrete_candidates.py`, `export-human-review-inputs.py`, `build-concrete-review.mjs`. Đầu ra gốc/chuẩn hóa, CSV, JSON trung gian và XLSX thẩm tra đều nằm ngoài repo, trong `_review_private`, có ACL giới hạn cho tài khoản Windows hiện tại. Giữ các file CSV/SQLite làm nguồn chi tiết; XLSX là lớp rà soát trình bày.

## Việc còn lại cho Giai đoạn 2

1. Người phụ trách kế toán/kinh doanh xác nhận ý nghĩa các cột thay đổi theo tháng, công thức DA tháng 03 và cách phân biệt dòng điều chỉnh với giao hàng.
2. Kế toán/kinh doanh rà 26 lệch chuyển kỳ, 725 trường hợp ghép thiếu/trùng khóa, các cờ dữ liệu và ý nghĩa cột thay đổi; xác nhận đơn vị tiền và công thức DA tháng 03.
3. Duyệt crosswalk khách hàng/dự án, xác định rõ quan sát khách hàng, dòng giao hàng, tổng, chuyển kỳ và điều chỉnh; lập gói nhập có lineage sau khi ký xác nhận.
4. Tạo migration/import PostgreSQL chỉ cho dữ liệu đã duyệt, có kiểm tra tổng trước-sau, khóa idempotent và phương án rollback; không dùng Production làm nơi staging hay thẩm tra.
