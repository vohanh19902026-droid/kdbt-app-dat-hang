# CENCOM GD1/GD2 — danh sách theo dõi công việc

**Cập nhật:** 06/11/2026
**Phạm vi:** phát hành GD1 an toàn; hoàn thiện hồ sơ dữ liệu công nợ/bán hàng GD2.
**Trạng thái hiện tại:** SUP-ADMIN Preview đã khởi tạo; GD1 vẫn chưa đủ điều kiện phát hành Production; GD2 chưa nhập dữ liệu kế toán vào ứng dụng.
**Quy tắc theo dõi:** hoàn tất và có bằng chứng cho bước nào thì đánh dấu `[x]` ngay tại bước đó trong file này; cập nhật ngày/trạng thái và ghi rõ bằng chứng hoặc điều kiện còn thiếu. Không đánh dấu các bước chỉ mới dự kiến.

## GD1 — một Preview được chọn làm ứng viên chính

### Đã hoàn tất

- [x] Chọn `codex/cencom-owner-preview` làm nhánh duy nhất tiếp tục hoàn thiện; commit code hiện tại `3935b85`. Không chạy song song các Preview/nhánh khác.
- [x] Tạo deployment `dpl_EWuzYS9zigJbQjRGd7ncQXc6JYDD` từ commit `3935b85`; trạng thái `READY`. Đã gắn alias ổn định `kdbt-app-dat-hang-git-codex-cencom-0462e1-vohanh19902026-droid.vercel.app` cho deployment này.
- [x] Build log xác nhận DB thuộc Neon cô lập, project/endpoint/database khớp (`ep-late-breeze-b37o52e8` / `neondb`); 15 migration đã có sẵn, không áp thêm file nào. `/api/health` trả `200`, database `up`.
- [x] Sửa Preview chỉ dùng URL Neon tích hợp sau khi kiểm tra project, endpoint và database; thêm `BETTER_AUTH_URL` chỉ cho nhánh Preview. Google callback đã dùng đúng alias ổn định; trang đăng nhập và khôi phục mật khẩu hiển thị.
- [x] Thử Google sign-in: redirect mismatch đã hết, đăng nhập tới trang khởi tạo chủ sở hữu Preview.
- [x] Người dùng xác nhận và hoàn tất bootstrap SUP-ADMIN cho tài khoản Google hiện tại trên DB Preview cô lập; chuyển được tới `/orders`, mở được `/admin/settings` với trang Cài đặt quản trị. Xác nhận trên alias ổn định ngày 06/11/2026.
- [x] Đồng bộ ứng viên Preview vào `main` cục bộ bằng fast-forward tới `ba2772d` ngày 06/11; giữ nguyên `origin/main` (`6037661`) và không push/deploy.

### Còn lại trước Production

- [x] Xoay lại credential role `neondb_owner` trên Preview sau lần đầu bị lộ trong ảnh; Neon xác nhận reset lần hai thành công ngày 06/11/2026. Credential mới chưa được đưa vào ảnh/chat.
- [x] Lưu Secret `PREVIEW_DATABASE_URL` trong Vercel, chỉ cho Preview của `codex/cencom-owner-preview`; giữ nguyên `DATABASE_URL` do Neon integration quản lý. Giá trị lấy từ file export Neon và khớp endpoint `ep-late-breeze-b37o52e8` / `neondb`; không ghi secret vào tài liệu hoặc chat.
- [x] Hoàn tất xác minh danh tính Vercel trong browser, redeploy Preview cùng commit `3935b85` thành deployment `dpl_4b6ePGwc3N8k7z3ViK1JsqfCpzqf` trạng thái `READY`; `/api/health` trả `200`, database `up` ngày 06/11/2026. Biến DB riêng vẫn giới hạn ở Preview branch `codex/cencom-owner-preview`; Production không thay đổi.
- [x] Đối chiếu Neon Console ngày 06/11: `PREVIEW_DATABASE_URL` được ghim vào endpoint `ep-late-breeze-b37o52e8` của nhánh `uat/notifications-scale-android` (`br-sparkling-fog-b3olxzet`), nhánh có nhãn `Schema-only`, hết hạn lúc 16:37 GMT+7; Preview deployment tự sinh `preview/codex/cencom-owner-preview` là nhánh khác có parent `main`. App dùng biến URL ghim và guard endpoint; không dùng nhánh Preview có parent `main` làm UAT.
- [ ] Hoàn tất Gmail SMTP Preview: đã tạo và xác minh các biến mã hóa `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `MAIL_FROM`, giới hạn Preview branch `codex/cencom-owner-preview`; Production không được chọn. Còn thiếu `SMTP_APP_PASSWORD` dạng Secret. Google đã xác minh lại và mở trang App Passwords; theo handoff bảo mật, chủ tài khoản tự tạo mật khẩu ứng dụng rồi tự lưu vào biến Vercel `SMTP_APP_PASSWORD` chỉ cho Preview branch này. Không gửi credential qua chat. Tab Google đang mở trang tạo App Password; tab Vercel đã điền tên biến, loại Secret, note và chỉ chọn branch Preview; chưa lưu vì giá trị phải do chủ tài khoản nhập. Sau đó redeploy Preview và kiểm tra email đặt lại mật khẩu.
- [ ] Sau khi SMTP Preview sẵn sàng, kiểm tra hồ sơ đăng ký bằng tài khoản Google test thứ hai, duyệt hồ sơ bằng SUP-ADMIN, rồi gửi và hoàn tất một email đặt lại mật khẩu. Chưa thể xác nhận luồng vì chưa có SMTP Preview và danh tính Google test thứ hai.
- [ ] Chốt RPO/RTO nghiệp vụ, xác minh cửa sổ PITR/retention phù hợp, rồi diễn tập một lần khôi phục vào branch Neon riêng và ghi thời gian/kết quả đối chiếu. Đọc chỉ metadata Neon Production ngày 06/11: project `neon-cinnabar-bucket`, branch `main`, PITR 6 giờ, 1 snapshot thủ công 40.25 MB ngày 04/11 không hết hạn, chưa có lịch snapshot; branch phục hồi riêng từ snapshot vẫn còn. Chưa diễn tập restore, đo RTO hoặc chốt RPO/RTO với chủ nghiệp vụ; không dùng branch chứa bản sao Production làm UAT.
- [ ] Sau các cổng trên: thêm `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` cùng SMTP vào Production và khai báo callback Production trong Google OAuth; áp migrations `0012_google_registration_approval.sql`, `0013_platform_owner.sql`, `0014_legacy_concrete_review.sql` bằng lệnh Production tường minh sau backup gate, đưa ứng viên đã duyệt vào `main`, rồi xác nhận deployment `READY`, đăng nhập Google và email khôi phục Production. Production đang chạy commit `6037661` ở trạng thái `READY`; chưa thay đổi.

> Android/APK và load test không thuộc cổng của đợt web này. Không xóa nhánh chứa thay đổi chưa nhập vào release hoặc nhánh khôi phục dữ liệu Production.


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
- [x] Tái audit artifact hiện có ngày 06/11 bằng `PYTHONIOENCODING=utf-8`: raw SQLite đạt `integrity_check=ok`, 18 sheet và XML↔SQLite formula mismatch bằng 0; XLSX đủ 8 sheet, 15 câu hỏi `CHỜ`, 57.450/57.450 trường review trống, 0 công thức/ô lỗi, không còn nhận định cũ; normalized rollup so với bản e2e `equal=true`. Đã chạy lại trực tiếp audit SQLite, XLSX và rollup trong phiên này, cùng kết quả. Chỉ đọc; không chạy lại pipeline, sửa nguồn hoặc import dữ liệu.

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

Không đánh dấu GD1 hoàn tất hoặc `production-ready` khi còn thiếu SMTP Preview, UAT, backup/restore/rollback hoặc kiểm thử cần thiết. Không đánh dấu GD2 hoàn tất khi kế toán/kinh doanh chưa duyệt quy tắc, ngoại lệ và crosswalk. Người dùng đã chọn Preview hiện tại làm ứng viên chính; `main` cục bộ và `codex/cencom-owner-preview` hiện cùng ở `ba2772d`. `origin/main` vẫn ở `6037661` (ahead 32 commit cục bộ) và Production chưa thay đổi; không push cho tới khi các cổng GD1 đạt. Deployment Preview chạy mã `3935b85`; các commit sau deployment chỉ cập nhật tài liệu. Đã kiểm tra ancestry: các commit Key Lạnh trên nhánh `codex/google-auth-preview` không thuộc `main` hoặc Preview candidate.
