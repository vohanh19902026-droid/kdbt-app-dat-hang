# CENCOM GD1/GD2 — danh sách theo dõi công việc

**Cập nhật:** 06/11/2026
**Phạm vi:** phát hành GD1 an toàn; hoàn thiện hồ sơ dữ liệu công nợ/bán hàng GD2.
**Trạng thái hiện tại:** chưa đủ điều kiện phát hành Production; chưa nhập dữ liệu kế toán vào ứng dụng.

## GD1 — hoàn tất luồng và phát hành

### Đã thực hiện

- [x] Đã phát triển luồng Google sign-in, đăng ký chờ Admin duyệt, hoàn tất hồ sơ và khôi phục mật khẩu qua email trong `main` cục bộ. Migration đăng ký là `0012_google_registration_approval.sql`; commit Key Lạnh không nằm trong danh sách commit của `main` hiện tại.
- [x] Kết quả kiểm tra cục bộ mới nhất được ghi trong cập nhật release 49: 64/64 tests, typecheck, lint, build đạt. Phải chạy lại trên release candidate cuối trước phát hành.
- [x] Kiểm tra Vercel chỉ đọc ngày 06/11: deployment Production mới nhất hiện `READY`, vẫn là bản đang chạy; chưa tạo deployment mới trong lượt này.
- [x] Đối chiếu lại Vercel ngày 06/11: Production `READY` ở commit `6037661`; Preview mới nhất của nhánh mục tiêu `ERROR` ở `74871e9`, nhánh chưa có `PREVIEW_DATABASE_URL`; chỉ xem tên/target, không giải mã secret.
- [x] Đối chiếu lại Git: local `main` ở `f425b38`, ahead `origin/main` 13 commit; các commit Key Lạnh `c634bc0`, `f149d49`, `cca7aea` không thuộc `main`; migration đánh số liên tục qua `0012_google_registration_approval.sql`.
- [x] Kiểm tra read-only Neon Production: project `neon-cinnabar-bucket`, branch `main`, gắn deployment `6037661`; PITR hiển thị 6 giờ, 1 snapshot thủ công ngày 04/11 không hết hạn, chưa có lịch snapshot. Không tạo snapshot hoặc đổi cấu hình Production.
- [x] Đọc build log của Production `6037661` mà không in giá trị DB: migrations `0000–0011` đều được bỏ qua, dry-run báo chưa ghi, bước apply có 0 file mới (12 file tổng). Log xác nhận code Production đang chạy dry-run/apply trong build; local `main` có thêm `0012–0014`.
- [x] Rà DDL/rollback `0010–0014` và runner: từng file chạy transaction riêng, không có down migration an toàn cho cập nhật data `0011`; schema/additive data cần được giữ khi rollback code, ưu tiên forward-fix/restore sang branch riêng.
- [x] Tách Production migration khỏi Vercel build trong release candidate; thêm lệnh explicit `db:migrate:production` có endpoint/database guard và chặn Production dry-run. Kiểm tra lệnh dry-run bị từ chối trước DB; giả lập `VERCEL_ENV=production` với DB loopback build thành công và không gọi migration.
- [x] Đã tắt cấu hình tự tạo DB branch cho mọi Preview deployment. Neon–Vercel chỉ chọn Preview; Production không chọn; `Require Active Resource` và `Sensitive` đang bật.
- [x] Đã chuẩn bị branch Neon schema-only `uat/notifications-scale-android`. Báo cáo trước ghi nhận baseline và migration `0011–0014` đã áp trên đúng endpoint UAT; cần dry-run và xác nhận lại trạng thái trước lần UAT tiếp theo.
- [x] Đã bổ sung kiểm tra endpoint DB Preview trong code để deployment dừng trước migration nếu endpoint không đúng.

### Còn phải làm

- [ ] **Xoay mật khẩu role DB Neon bị lộ.** Thực hiện trực tiếp trong Neon. Không gửi mật khẩu/connection string qua chat.
- [ ] **Cấu hình Vercel Preview đúng đích DB cô lập.** Kiểm tra metadata Vercel ngày 06/11 (không giải mã giá trị) cho nhánh `codex/cencom-owner-preview` thấy `DATABASE_URL`, `PREVIEW_DATABASE_ENDPOINT_ID` và Google OAuth variables, nhưng thiếu `PREVIEW_DATABASE_URL` mà guard ở commit local hiện yêu cầu. Các biến metadata Preview dùng chung có `PREVIEW_DATABASE_PROJECT_ID`, `DATABASE_NEON_PROJECT_ID` và `PREVIEW_DATABASE_NAME`; điều này chưa chứng minh URL kết nối được pin đúng branch UAT. Build Preview mới nhất của commit remote `74871e9` báo URL Preview không hợp lệ; commit local `03220bd` chưa được đẩy nên chưa kiểm chứng guard mới. Không dùng `DATABASE_URL` thay cho URL Preview được pin.
- [ ] Xác minh project, branch `uat/notifications-scale-android`, database và endpoint ID từ metadata an toàn; kiểm tra guard trước mọi migration. Không kết nối Neon `main`/Production.
- [ ] Sau khi DB secret được xoay và biến Preview được cấu hình, đẩy nhánh `codex/cencom-owner-preview` (local ahead remote 3 commit, gồm Preview guard `03220bd` và các commit handoff/migration safety; chưa push) và tạo deployment Preview mới. Chỉ tiếp tục nếu deployment `READY`, đúng alias và endpoint guard đạt.
- [ ] Chạy migration dry-run trên DB UAT đã xác nhận. Áp dụng **chỉ migration còn thiếu** nếu có; không chạy lại toàn bộ migration đã có baseline.
- [ ] Xác nhận Google OAuth origin/callback khớp đúng URL Preview duy nhất; chạy browser UAT: đăng nhập Google, đăng ký mail mới, hoàn tất hồ sơ, trạng thái chờ duyệt, Admin duyệt/đổi role, đăng xuất/đăng nhập và quên mật khẩu.
- [ ] Cấu hình SMTP riêng cho Preview bằng secret manager rồi thử email xác minh/đặt lại mật khẩu. Không ghi secret vào repo, log hoặc chat.
- [ ] Chạy browser UAT theo các role và load test read-only trên deployment Preview `READY`; lưu evidence không chứa secrets hoặc PII không cần thiết.
- [ ] Kiểm tra Vercel Production variables bằng tên/target metadata. Lần kiểm tra 06/11 cho thấy chưa có `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SMTP_USER` hoặc `SMTP_APP_PASSWORD`; luồng Google và reset password chưa sẵn sàng ở Production.
- [ ] Chủ nghiệp vụ xác nhận RPO/RTO và yêu cầu retention. Neon Production hiện chỉ hiển thị PITR 6 giờ, 1 snapshot thủ công (04/11, không hết hạn), chưa có lịch snapshot; đánh giá/thiết lập retention phù hợp theo quy trình được phép. Sau đó diễn tập restore trên branch/database riêng và hoàn thiện rollback deployment/migration. Chưa dùng Production để thử restore.
- [ ] Thử Web Push trên Android thật với key Preview riêng; xác nhận key Production riêng. APK/TWA, signing và Digital Asset Links là hạng mục bàn giao Android riêng nếu nằm trong đợt phát hành.
- [ ] Chạy lại test, typecheck, lint, build, audit trên release candidate cuối; rà commit/diff để bảo đảm không có commit Key Lạnh.
- [ ] Sau khi các cổng và backup/PITR đạt, chủ tài khoản chạy migration Production tường minh bằng `vercel env run -e production -- npm run db:migrate:production` rồi xác nhận migration log. Build Vercel Production không tự migrate; không chạy Production dry-run.
- [ ] Chỉ sau khi mọi cổng trên có evidence mới chốt commit, kế hoạch PR/push `main`, migration Production, cửa sổ phát hành và rollback. `main` local hiện ahead `origin/main` **13 commits**; checkout đang làm việc là `codex/cencom-owner-preview`, ahead remote 3 commit. Chưa push các commit này.

### Chủ sở hữu cần phối hợp

- Chủ tài khoản Neon: xoay role password.
- Chủ Vercel: thêm `PREVIEW_DATABASE_URL` Preview theo nhánh và các secret Preview cần thiết.
- Admin/đầu mối OAuth: kiểm tra test user, callback và luồng Google.
- Đầu mối mail: cấu hình/kiểm tra SMTP Preview và Production.
- Chủ nghiệp vụ/IT: xác nhận RPO/RTO, restore và rollback.

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
