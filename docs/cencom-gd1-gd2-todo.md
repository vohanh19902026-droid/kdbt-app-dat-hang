# CENCOM GD1/GD2 — danh sách theo dõi công việc

**Cập nhật:** 06/11/2026
**Phạm vi:** phát hành GD1 an toàn; hoàn thiện hồ sơ dữ liệu công nợ/bán hàng GD2.
**Trạng thái hiện tại:** chưa đủ điều kiện phát hành Production; chưa nhập dữ liệu kế toán vào ứng dụng.
**Quy tắc theo dõi:** hoàn tất và có bằng chứng cho bước nào thì đánh dấu `[x]` ngay tại bước đó trong file này; cập nhật ngày/trạng thái và ghi rõ bằng chứng hoặc điều kiện còn thiếu. Không đánh dấu các bước chỉ mới dự kiến.

## GD1 — một đường phát hành, các cổng bắt buộc

### Đã có

- [x] Luồng Google đăng nhập, đăng ký chờ Admin duyệt và khôi phục mật khẩu qua email đã có trong `main` cục bộ (`f425b38`); Key Lạnh không nằm trong nhánh này.
- [x] Kiểm tra cục bộ gần nhất được ghi nhận: 64/64 tests, typecheck, lint và build đạt.
- [x] Đã chọn hướng gọn: một release candidate; không làm load test/APK thành điều kiện cho đợt web này; không tạo thêm Preview branch.

### Còn lại trước khi đưa bản chính thức

- [ ] **Chốt một release candidate GD1.** Dùng `main` làm nền; lấy riêng phần tách migration Production khỏi build từ `codex/cencom-owner-preview` nếu cần. Không kèm tính năng import dữ liệu GD2 (`0014`) hay Key Lạnh vào đợt này.
- [ ] **Một lần xác nhận Preview trên DB cô lập.** Xoay credential DB từng bị lộ; gắn đúng URL tới Neon UAT hiện hành; chạy migration cần thiết và kiểm tra gọn luồng đăng ký-chờ duyệt, Admin duyệt, đăng nhập và email khôi phục. Không dùng Production cho bước này.
- [ ] **Xác nhận cấu hình Production tối thiểu.** Google OAuth và SMTP cần có đủ biến môi trường; xác minh đường lui khôi phục từ snapshot đã có. Hiện Production thiếu biến OAuth/SMTP; snapshot tồn tại nhưng chưa diễn tập khôi phục.
- [ ] **Phát hành một lần.** Khi các cổng trên đạt: đưa release candidate lên `main`, áp migration có chủ đích, chờ deployment `READY`, xác nhận đăng nhập/đăng ký/khôi phục trên Production và ghi commit/deployment vào checklist.

> Các lần kiểm tra Preview, migration và Neon đã ghi ở release assessment là bằng chứng lịch sử; không lặp lại. Chỉ cập nhật checklist khi có kết quả mới.


## GD2 — chuẩn hóa dữ liệu bê tông và thẩm tra

### Đã thực hiện

- [x] Đã rà 9 workbook tháng 01–09/2026; chỉ dùng hai sheet `PKDBT- DA` (dự án) và `PKDBT DC` (dân cư), giữ riêng cấu trúc DA/DC.
- [x] Đã hiệu chỉnh roster NVKD dựa trên ô tên tô vàng trong đúng hai sheet: 22 tên ứng viên, 216 chứng cứ ô; 18 nhãn nhóm/trạng thái được loại khỏi roster.
- [x] Đã tạo SQLite raw, SQLite chuẩn hóa ứng viên, CSV truy xuất nguồn và workbook thẩm tra; dữ liệu chưa nhập vào app/Preview/Production.
- [x] Đã tạo workbook thẩm tra 8 tab: Guide, Control summary, Business questions, Roster, Roster evidence, Customer balances, Carry-forward exceptions và Review issues.
- [x] Đã thêm 15 câu hỏi nghiệp vụ cụ thể. Cả 15 đang ở trạng thái `CHỜ`; kết luận, người xác nhận, ngày và căn cứ đều trống.
- [x] Đã xác minh bằng Artifact Tool: 2.069 cờ review; mọi trường quyết định/người duyệt/ngày/căn cứ trong các tab review đều trống. Kiểm tra XML ghi nhận 0 công thức và 0 ô lỗi công thức; Control summary là số staging tĩnh, không phải bảng cân đối tự tính.
- [x] Thư mục output kế thừa ACL chỉ cấp FullControl cho `HANHVO\Admin`.
- [x] Kiểm kê chỉ đọc 9 workbook, SHA-256/timestamp, công thức/cache/lỗi cho đúng hai sheet đích; manifest riêng nằm ngoài Git. DA: 18.841 công thức, 18.841 cache, 0 lỗi; DC: 61.406/61.406/0. DA tháng 03 có 4/4 cache; số cũ 900–1.142 được rút do không cùng phạm vi đếm.
- [x] Sửa extractor để giữ 3 công thức/cache trong ô phụ của vùng gộp mà `openpyxl` bỏ qua (DC T03: V238, V1086; T06: U1130); giữ số Decimal chính xác. Đã tái tạo raw/normalized staging và workbook review; XML ↔ SQLite có 0 chênh lệch ô công thức, SQLite `integrity_check=ok`, các rollup ứng viên trước/sau bằng nhau.
- [x] Tái tạo workbook thẩm tra sau khi sửa Q06: đủ 8 sheet; 15 câu hỏi `CHỜ`; 0 công thức/ô lỗi; 57.450 ô nhập review đều trống; không còn dẫn số 900–1.142 cũ. Chưa có phê duyệt nghiệp vụ.
- [x] Kiểm tra lại artifacts ngày 06/11: SQLite integrity_check=ok, 18/18 sheet khớp tập ô công thức XML↔SQLite; workbook đủ 8 sheet, 15 câu hỏi CHỜ, 57.450 ô review trống, 0 công thức/lỗi; ACL output chỉ HANHVO\Admin có Full Control.
- [x] Tái chạy end-to-end trên bản sao kiểm chứng riêng có ACL giới hạn: kiểm kê → trích xuất → chuẩn hóa → xuất đầu vào review → dựng XLSX → audit. Rollup khớp staging bàn giao (`equal=true`); SQLite integrity và XML↔SQLite đạt; XLSX 8 sheet, 15 câu hỏi CHỜ, 57.450 ô review trống, 0 công thức/lỗi.
- [x] Đối chiếu lại artifact GD2 ngày 06/11 và phát hiện file raw mặc định không đầy đủ dù `integrity_check=ok` (chỉ 1 workbook/tháng 01). Đã giữ nguyên file đó, sao chép DB raw đầy đủ từ lần chạy kiểm chứng vào `cencom-2026-01_09-raw-staging-verified.sqlite`; SHA-256 bản sao khớp nguồn, audit 9 workbook/18 sheet/231.558 ô, 0 chênh lệch công thức XML↔SQLite. SQLite normalized hiện tại và bản kiểm chứng có rollup bằng nhau; XLSX 8 sheet/15 câu hỏi CHỜ/57.450 ô review trống/0 công thức-lỗi; workbook nguồn không đổi.
- [x] Bổ sung nút lọc Table cho sheet `Business questions`; kiểm tra lại bằng Artifact Tool, các sheet review dữ liệu và câu hỏi đều có filter button, các pane `A2` giữ nguyên. So sánh trước/sau xác nhận mọi giá trị, kích thước và thứ tự sheet không đổi; audit XLSX vẫn đạt.
- [x] Tái audit artifact hiện có ngày 06/11 bằng `PYTHONIOENCODING=utf-8`: raw SQLite đạt `integrity_check=ok`, 18 sheet và XML↔SQLite formula mismatch bằng 0; XLSX đủ 8 sheet, 15 câu hỏi `CHỜ`, 57.450/57.450 trường review trống, 0 công thức/ô lỗi, không còn nhận định cũ; normalized rollup so với bản e2e `equal=true`. Chỉ đọc; không chạy lại pipeline, sửa nguồn hoặc import dữ liệu.

### Còn phải làm

- [ ] Kế toán/kinh doanh xác nhận đơn vị tiền, ý nghĩa header thay đổi theo tháng và các cột thanh toán; xác nhận cột thanh toán có phải sổ thu đầy đủ hay chỉ snapshot.
- [ ] Kế toán/kinh doanh xác minh vì sao DA tháng 03 chỉ có 4 công thức trong khi các tháng khác có 1.930–2.508; XML ngày 06/11 ghi nhận 4/4 công thức tháng 03 và toàn bộ công thức hai sheet đều có cache, 0 ô lỗi. Đây là khác biệt cấu trúc cần giải thích nghiệp vụ; cache hiện diện không xác nhận phép tính đúng. Con số cũ 900–1.142 đã được rút lại do không cùng phạm vi đếm.
- [ ] Phân loại các dòng ứng viên thành tiêu đề/nhóm/tổng/chuyển kỳ/điều chỉnh/giao hàng/rỗng; không mặc định 15.123 dòng hoạt động là giao dịch.
- [ ] Người phụ trách rà 26 lệch chuyển kỳ, 725 cặp chưa ghép chắc chắn, 995 khóa trùng trong tháng, 397 tên gắn nhiều khóa và 632 khóa yếu chỉ dựa trên tên. Không tự gộp hoặc cân chỉnh.
- [ ] Hoàn thiện crosswalk khách hàng/dự án có người duyệt và bằng chứng nguồn; không gộp theo tên, địa chỉ hoặc điện thoại nếu thiếu khóa nghiệp vụ đã xác nhận.
- [ ] Điền quyết định, người duyệt, ngày, căn cứ và ghi chú trong workbook; lưu bản đã duyệt riêng, giữ nguyên bản nguồn và workbook ứng viên.
- [ ] Sau khi ký xác nhận, xây gói import idempotent, kiểm soát tổng trước/sau và rollback; chạy trước chỉ trên Neon Preview cô lập. Không import Production trong giai đoạn thẩm tra.
- [ ] Đối chiếu dữ liệu import với workbook đã duyệt; lập biên bản chấp nhận trước khi chuyển sang vận hành.
- [ ] Trước lần chạy lại staging tại chỗ, đóng chương trình/process đang giữ file SQLite raw. Lần chạy tại chỗ ngày 06/11 gặp Windows `WinError 32`; đã xác minh khả năng tái tạo trên thư mục riêng thay vì ghi đè file đang mở.

### Số liệu staging cần giữ đúng ngữ nghĩa

- 8.243 quan sát khách hàng/dự án theo tháng; **không phải** 8.243 khách duy nhất.
- 4.411 khóa ứng viên; 103 ứng viên dự án / 799 quan sát dự án.
- 15.123 dòng hoạt động ứng viên.
- Cân đối cùng kỳ: 230 khớp, 8.013 thiếu đầu vào số.
- Chuyển kỳ: 1.172 khớp, 26 lệch, 725 chưa ghép chắc chắn.

## Bằng chứng và tài liệu

- Release assessment: [release-assessment-2026-11-03.md](release-assessment-2026-11-03.md)
- Đánh giá phase 2: [phase2-concrete-data-assessment.md](phase2-concrete-data-assessment.md)
- Quy trình release: [release-process.md](release-process.md)
- Workbook thẩm tra mới: `E:\1. CENCOM 2026\1. BÁO CÁO ĐƠN VỊ\1. BÁO CÁO CÔNG NỢ\CÔNG NỢ NĂM 2026\NĂM 2026\_review_private\outputs\01a1a100-147b-7a12-a58d-c96631e35580\cencom-2026-01_09-human-review.xlsx`
- Staging SQLite/CSV và lệnh tái tạo nằm trong `_review_private` cạnh workbook nguồn; không đưa dữ liệu nhạy cảm vào Git.

## Ranh giới phát hành

Không đánh dấu GD1 hoàn tất hoặc `production-ready` khi còn thiếu credential Preview đã xoay, deployment/UAT Preview, OAuth/SMTP, backup/restore/rollback hoặc kiểm thử cần thiết. Không đánh dấu GD2 hoàn tất khi kế toán/kinh doanh chưa duyệt quy tắc, ngoại lệ và crosswalk. `origin/main` và Production chưa được thay đổi trong lượt kiểm tra này; `main` cục bộ vẫn chứa 13 commit chưa đẩy.
