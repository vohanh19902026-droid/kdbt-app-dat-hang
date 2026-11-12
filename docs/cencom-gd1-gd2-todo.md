# CENCOM GD1/GD2 — danh sách theo dõi công việc

**Cập nhật:** 07/11/2026
**Phạm vi:** phát hành GD1 an toàn; hoàn thiện hồ sơ dữ liệu công nợ/bán hàng GD2.
**Trạng thái hiện tại:** GD1 demo đã chốt với ngoại lệ được ghi rõ, chưa production-ready. GD2 có staging riêng và workbook tổng hợp quản trị theo tháng/NVKD; đang chờ người phụ trách đối chiếu số tạm trong Excel.
**Quy tắc theo dõi:** hoàn tất và có bằng chứng cho bước nào thì đánh dấu `[x]` ngay tại bước đó trong file này; cập nhật ngày/trạng thái và ghi rõ bằng chứng hoặc điều kiện còn thiếu. Không đánh dấu các bước chỉ mới dự kiến.

## GD1 — một Preview được chọn làm ứng viên chính

### Đã hoàn tất

- [x] Chọn `codex/cencom-owner-preview` làm nhánh duy nhất tiếp tục hoàn thiện; candidate code hiện tại `5c34d73`. Không chạy song song các Preview/nhánh khác.
- [x] Tạo deployment `dpl_EWuzYS9zigJbQjRGd7ncQXc6JYDD` từ commit `3935b85`; trạng thái `READY`. Đã gắn alias ổn định `kdbt-app-dat-hang-git-codex-cencom-0462e1-vohanh19902026-droid.vercel.app` cho deployment này.
- [x] Build log xác nhận DB thuộc Neon cô lập, project/endpoint/database khớp (`ep-late-breeze-b37o52e8` / `neondb`); 15 migration đã có sẵn, không áp thêm file nào. `/api/health` trả `200`, database `up`.
- [x] Sửa Preview chỉ dùng URL Neon tích hợp sau khi kiểm tra project, endpoint và database; thêm `BETTER_AUTH_URL` chỉ cho nhánh Preview. Google callback đã dùng đúng alias ổn định; trang đăng nhập và khôi phục mật khẩu hiển thị.
- [x] Thử Google sign-in: redirect mismatch đã hết, đăng nhập tới trang khởi tạo chủ sở hữu Preview.
- [x] Người dùng xác nhận và hoàn tất bootstrap SUP-ADMIN cho tài khoản Google hiện tại trên DB Preview cô lập; chuyển được tới `/orders`, mở được `/admin/settings` với trang Cài đặt quản trị. Xác nhận trên alias ổn định ngày 06/11/2026.
- [x] Đồng bộ ứng viên Preview vào `main` cục bộ bằng fast-forward ngày 06/11; giữ nguyên `origin/main` (`6037661`). Candidate code `5c34d73` cũng đã được đẩy riêng lên nhánh Preview để chạy build/UAT.

### Còn lại trước Production

- [x] Xoay lại credential role `neondb_owner` trên Preview sau lần đầu bị lộ trong ảnh; Neon xác nhận reset lần hai thành công ngày 06/11/2026. Credential mới chưa được đưa vào ảnh/chat.
- [x] Lưu Secret `PREVIEW_DATABASE_URL` trong Vercel, chỉ cho Preview của `codex/cencom-owner-preview`; giữ nguyên `DATABASE_URL` do Neon integration quản lý. Giá trị lấy từ file export Neon và khớp endpoint `ep-late-breeze-b37o52e8` / `neondb`; không ghi secret vào tài liệu hoặc chat.
- [x] Hoàn tất xác minh danh tính Vercel trong browser, redeploy Preview cùng commit `3935b85` thành deployment `dpl_4b6ePGwc3N8k7z3ViK1JsqfCpzqf` trạng thái `READY`; `/api/health` trả `200`, database `up` ngày 06/11/2026. Biến DB riêng vẫn giới hạn ở Preview branch `codex/cencom-owner-preview`; Production không thay đổi.
- [x] Đối chiếu Neon Console ngày 06/11: `PREVIEW_DATABASE_URL` được ghim vào endpoint `ep-late-breeze-b37o52e8` của nhánh `uat/notifications-scale-android` (`br-sparkling-fog-b3olxzet`), nhánh có nhãn `Schema-only`; gia hạn thời điểm hết hạn thêm 24 giờ đến 16:37 GMT+7 ngày 07/11 để không mất Preview giữa lúc hoàn tất UAT. Preview deployment tự sinh `preview/codex/cencom-owner-preview` là nhánh khác có parent `main`. App dùng biến URL ghim và guard endpoint; không dùng nhánh Preview có parent `main` làm UAT.
- [x] Siết Preview DB guard: chỉ nhận `PREVIEW_DATABASE_URL`, không fallback sang `DATABASE_URL` do Neon integration; build Preview chạy migration dry-run trước rồi mới chạy apply. Commit `5c34d73`; 66/66 test, typecheck, lint, build, `npm audit --omit=dev --audit-level=moderate` (0 lỗ hổng) đạt.
- [x] Đẩy riêng nhánh ứng viên `codex/cencom-owner-preview` để tạo Preview deployment `dpl_9UUs72m3WDwsqmc93gGBGtK54Pk3`, commit `5c34d73`, trạng thái `READY`. Build log xác nhận dry-run trên endpoint cô lập `ep-late-breeze-b37o52e8`/`neondb`, đủ 15 migration `0000–0014` đã áp; apply báo 0 file mới. `/api/health` trả `status=ok`, `database=up`, 1.583 ms ngày 06/11. Production deployment sau thao tác này vẫn `READY` trên `6037661`; không có thay đổi Production.
- [x] Browser read-only trên deployment `5c34d73`: `/login` hiển thị Google đăng ký và thông báo tài khoản mới chờ Admin kích hoạt; `/forgot-password` hiển thị form gửi liên kết xác minh. Chưa gửi form, dùng danh tính thứ hai hay tạo hồ sơ.
- [x] **Chốt hoãn theo quyết định người dùng (demo, 06/11):** không cấu hình `SMTP_APP_PASSWORD` và không chạy UAT gửi email/reset password hay đăng ký Google bằng tài khoản thứ hai trong đợt chốt này. Hạ tầng gửi email chưa được xác minh; luồng email khôi phục mật khẩu không được xem là hoạt động. Mở lại mục này trước khi dùng cho người dùng thật.
- [x] Rà soát tài liệu rollback code/migration và metadata Production ngày 06/11: deployment hiện hành `dpl_GEzr5DWujDfgerJE2iompH5PQuHU` / commit `6037661` và deployment liền trước `dpl_DC3hKqMwN7Zhci1pF75iCRYvhUnJ` / commit `c2c148f` đều `READY`. Tài liệu ghi rollback Vercel trước, giữ schema/dữ liệu của migration, không tự chạy down; migration `0011` là cập nhật dữ liệu không có before-image nên nếu sai phải forward-fix. Xác nhận lại deployment/alias ngay trước release. [release-process.md](release-process.md)
- [x] Diễn tập khôi phục snapshot theo chế độ multi-step ngày 06/11: Neon xác nhận `Snapshot was successfully restored` trong 1,14 giây; tạo branch riêng `branch_from_snapshot_Nov 6, 2026 4:01 PM GMT+7` (`br-young-truth-aoe2axn5`) trong project Production. Hộp thoại xác nhận branch `main` không đổi; không chuyển connection/app sang branch mới và không dùng làm UAT. Thời gian 1,14 giây chỉ đo thao tác restore của Neon, chưa phải RTO dịch vụ end-to-end. Nhánh chứa snapshot Production còn tồn tại và `Expires: Never`; chưa kết nối ứng dụng hoặc đọc dữ liệu nghiệp vụ.
- [x] **Chốt hoãn theo quyết định người dùng (demo, 06/11):** chưa chốt RPO/RTO nghiệp vụ và chưa diễn tập khôi phục ở mức ứng dụng. Mốc tham khảo để thảo luận: RPO ≤ 1 giờ, RTO ≤ 4 giờ; chưa phải cam kết đạt. Neon đang cho thấy PITR/history retention 6 giờ và snapshot thủ công 40.25 MB ngày 04/11. Thao tác restore 1,14 giây không phải RTO dịch vụ. Cần mở lại trước khi vận hành thật; diễn tập chỉ trên Preview schema-only/dữ liệu tổng hợp.
- [x] Tổng quát hóa danh tính bootstrap SUP-ADMIN thành biến `PLATFORM_OWNER_EMAIL` theo từng cài đặt; mã cũ không còn gắn cứng Gmail cá nhân. Cập nhật `.env.example`/hướng dẫn và `npm run typecheck` đạt ngày 07/11. Chưa deploy; từng môi trường phải cấu hình danh tính đúng trước khi dùng luồng bootstrap.
- [ ] Sau các cổng trên: thêm `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` cùng SMTP vào Production và khai báo callback Production trong Google OAuth; áp migrations `0012_google_registration_approval.sql`, `0013_platform_owner.sql`, `0014_legacy_concrete_review.sql` bằng lệnh Production tường minh sau backup gate, đưa ứng viên đã duyệt vào `main`, rồi xác nhận deployment `READY`, đăng nhập Google và email khôi phục Production. Production đang chạy commit `6037661` ở trạng thái `READY`; chưa thay đổi.

> Android/APK và load test không thuộc cổng của đợt web này. Không xóa nhánh chứa thay đổi chưa nhập vào release hoặc nhánh khôi phục dữ liệu Production.


## GD2 — chuẩn hóa dữ liệu bê tông và thẩm tra

### Đã thực hiện
> Ghi chú cập nhật 06/11: các mục “8 tab/15 câu hỏi” phía dưới là lịch sử bản thẩm tra đầu. Bản bàn giao hiện tại là workbook 9 tab có `NVKD monthly summary`; phạm vi được rút gọn theo chỉ đạo chủ dự án, không thẩm tra công thức kế toán.


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
- [x] Tái audit trực tiếp ngày 06/11: raw SQLite `integrity_check=ok`, 18 sheet/9 tháng, XML↔SQLite formula mismatch=0; DA tháng 03 có đúng 4 công thức. XLSX đủ 8 sheet, 15 câu hỏi `CHỜ`, 57.450/57.450 trường review trống, 0 công thức/ô lỗi; normalized rollup bằng bản kiểm chứng (`equal=true`). Đối chiếu lại manifest hiện tại: đủ 9 workbook nguồn, SHA-256/kích thước/timestamp trong ngưỡng 2 giây đều khớp. Chỉ đọc; không sửa workbook nguồn, chạy lại pipeline hay import.

- [x] Rà soát kỹ thuật thêm ngày 06/11/2026: chạy `npm run data:legacy:import -- --source-dir '<thư mục nguồn>\_review_private' --dry-run`; manifest `38922fcea820116ecd21bb2aea65d3d856e39b4c7041e5687aabbe93df073a9`, 9 workbook, roster 22/216 chứng cứ, 4.411 khóa ứng viên, 8.243 quan sát/snapshot, 7.337 quan sát có nhãn NVKD. Lệnh xác nhận cấu trúc/hash và số lượng; không kết nối DB, không ghi dữ liệu, mọi quan sát vẫn `PENDING_HUMAN_REVIEW` và đơn vị nguồn `UNCONFIRMED_SOURCE_UNIT`. Không kết nối DB hoặc ghi dữ liệu; bước đối chiếu Excel vẫn còn mở.
- [x] Theo chỉ đạo 06/11, thay bộ câu hỏi kế toán 15 mục bằng workbook quản trị 9 tab: `NVKD monthly summary` có 195 dòng tháng × mảng × NVKD; 6 mục xác nhận (2 phạm vi đã chốt theo yêu cầu, 4 đối chiếu còn chờ). Artifact audit: 0 công thức/lỗi; 75.482 ô review trống; 11.214/11.520 dòng m³ được cộng; 906 dòng khách chưa gán NVKD và 121 dòng dư nợ thiếu/không đọc được được giữ riêng. Workbook mới ở thư mục `management-summary-v2-20261106`; workbook nguồn không sửa, không import DB.
- [x] Tạo nhánh UAT schema-only ngày 09/11, áp migration `0014_legacy_concrete_review.sql`, nạp dữ liệu và xác minh; sau khi chuyển dữ liệu, xóa nhánh UAT cùng ba nhánh Neon Preview cũ. Danh sách Neon của project `cencom-preview-isolated` hiện chỉ còn nhánh `main` (`br-raspy-sky-b3tmt2ta`). Các deployment Preview cũ gắn với ba nhánh đã xóa không còn DB nhánh riêng.
- [x] Chuyển dữ liệu lịch sử review-only sang Neon `main` gắn Production ngày 09/11/2026 bằng transaction liên cơ sở dữ liệu; Neon không có thao tác merge nhánh kiểu Git. Nguồn manifest `38922fcea820116ecd21bb2eaea65d3d856e39b4c7041e5687aabbe93df073a9`; kết quả xác minh: migration 0014=1, 1 batch, 22 roster NVKD, 198 bằng chứng cá nhân, 4.411 entity, 8.243 quan sát, 7.337 có NVKD. Cả 8.243 quan sát vẫn `PENDING_HUMAN_REVIEW` và `UNCONFIRMED_SOURCE_UNIT`; không tạo khách hàng hoặc công nợ nghiệp vụ. Mã ứng dụng Production vẫn là `6037661`; trang tra cứu lịch sử chưa được phát hành trên Production. Neon project chỉ còn `main`.

### Còn phải làm

- [x] Người dùng xác nhận danh sách NVKD đã đủ để đối chiếu cho bộ dữ liệu lịch sử; dùng roster màu vàng corrected (22 tên/216 chứng cứ). Đây không phải xác minh tài khoản nhân sự hay phê duyệt vai trò đăng nhập.
- [ ] Rà riêng 906 dòng chưa gán NVKD. Chỉ bổ sung người phụ trách khi workbook nguồn có căn cứ; nếu chưa rõ thì giữ ở nhóm chưa gán.
- [ ] Kế toán xác nhận 121 dòng dư nợ trống/không đọc được và đơn vị dư nợ; giữ riêng, không suy diễn.
- [ ] Đối chiếu tab `NVKD monthly summary` với Excel tháng tương ứng nếu cần: người dùng chốt tháng 09 là chuẩn, các tháng 01–08 chỉ xem tham khảo và chấp nhận sai số nhỏ. Không sửa workbook gốc.
- [ ] Trước lần chạy lại staging tại chỗ, đóng chương trình/process đang giữ file SQLite raw. Lần chạy tại chỗ ngày 06/11 gặp Windows `WinError 32`; đã xác minh tái tạo trên thư mục riêng.

### Số liệu staging cần giữ đúng ngữ nghĩa

- 195 dòng tổng hợp tháng × mảng × NVKD; 8.243 dòng khách/dự án nguồn, trong đó 7.337 có NVKD và 906 để riêng chưa gán.
- 11.214 dòng khối lượng có ngày, mác và khối lượng số đọc được trong 11.520 dòng hoạt động ứng viên; m³ là ước tính, không gồm khối lượng bơm.
- Dư nợ cuối tháng: tổng các giá trị số đọc được theo nhóm NVKD, giữ nguyên đơn vị nguồn; 8.122 dòng có số và 121 dòng trống/không đọc được.
- Số khách tham khảo là số tên nguồn khác nhau trong từng tháng/NVKD; cột dòng nguồn đi kèm. Không khử trùng fuzzy và không coi đây là mã khách hàng duy nhất.
- Với dân cư, dư nợ được gộp theo NVKD phụ trách theo chỉ đạo chủ dự án; đây là báo cáo quản trị nội bộ, chưa phải xác nhận hạch toán. Mọi giá trị phải được đối chiếu Excel.

## Bằng chứng và tài liệu

- Release assessment: [release-assessment-2026-11-03.md](release-assessment-2026-11-03.md)
- Đánh giá phase 2: [phase2-concrete-data-assessment.md](phase2-concrete-data-assessment.md)
- Quy trình release: [release-process.md](release-process.md)
- Workbook thẩm tra hiện hành: `E:\1. CENCOM 2026\1. BÁO CÁO ĐƠN VỊ\1. BÁO CÁO CÔNG NỢ\CÔNG NỢ NĂM 2026\NĂM 2026\_review_private\outputs\management-summary-v2-20261106\cencom-2026-01_09-human-review.xlsx`.
- Staging SQLite/CSV và lệnh tái tạo nằm trong `_review_private` cạnh workbook nguồn; không đưa dữ liệu nhạy cảm vào Git.

## Ranh giới phát hành

Người dùng chấp nhận GD1 ở mức demo khoảng 98%, với hai ngoại lệ được hoãn rõ: email SMTP/UAT email và RPO/RTO/khôi phục ứng dụng. Đây không phải xác nhận `production-ready`; email đặt lại mật khẩu chưa xác minh, Google OAuth/SMTP Production và migrations Production chưa cấu hình/áp dụng. Production hiện vẫn `READY` tại `6037661`. Preview ứng viên vẫn là deployment `dpl_9UUs72m3WDwsqmc93gGBGtK54Pk3` (`5c34d73`). Nhánh Production snapshot `br-young-truth-aoe2axn5` không thuộc ứng dụng/UAT. Không tự động xóa nhánh hoặc đổi cấu hình Production.

- [x] Gộp 42 commit local thành một commit chốt trên `main` dựa trên `origin/main`; working tree sạch và `main` ahead một commit. Không tạo nhánh release mới, chưa push/deploy. Việc gom lịch sử không đồng nghĩa với phát hành Production.

Không đánh dấu GD2 hoàn tất khi kế toán/kinh doanh chưa duyệt quy tắc, ngoại lệ và crosswalk. Các commit Key Lạnh trên `codex/google-auth-preview` không thuộc `main`.

### Cập nhật lần 62 — đánh giá Production trực tiếp (09/11/2026)

- Vercel xác nhận domain Production `kdbt-app-dat-hang-five.vercel.app` đang trỏ deployment `dpl_GEzr5DWujDfgerJE2iompH5PQuHU`, `READY`, commit `6037661e9d996f212604f4b337dca44ccc7d5d91` (`docs: publish interactive CENCOM user handbook`). Git local vẫn `main` ahead `origin/main` 1 commit (`698ede0`); commit release chưa được đẩy nên chưa thể là code Production.
- Kiểm tra live ngày 09/11: `/api/health` trả HTTP 200, `status=ok`, `database=up`, `latencyMs=2136`; `/login` trả trang đăng nhập tài khoản do Admin cấp. Đây chỉ xác nhận trang và health endpoint, không phải UAT toàn vai trò.
- Metadata môi trường Vercel (không giải mã secret): Google OAuth, SMTP và VAPID chỉ được khai báo cho Preview; không thấy biến SMTP App Password. Production thiếu cấu hình Google sign-in, email đặt lại mật khẩu và Web Push.
- Log Vercel 7 ngày có 3.292 lỗi truy cập `app_notifications` (lần cuối 05/11) và lỗi `usage_events`; log 24 giờ gần nhất chỉ có cảnh báo SSL mode, không có bằng chứng UAT chức năng mới. Không coi log cũ là lỗi đang tái diễn, nhưng đây là bằng chứng luồng thông báo từng thiếu migration.
- Neon Production đã nhận dữ liệu history review-only (1 batch, 22 NVKD, 4.411 entity, 8.243 quan sát); toàn bộ 8.243 quan sát vẫn `PENDING_HUMAN_REVIEW` / `UNCONFIRMED_SOURCE_UNIT`, không phải khách hàng/công nợ nghiệp vụ đã duyệt. Code Production hiện hành không có màn tra cứu history tương ứng.
- **Kết luận bàn giao:** chưa đủ điều kiện bàn giao sử dụng chính thức cho các đơn vị. Có thể mở demo/pilot giới hạn các luồng cũ nếu tài khoản cấp sẵn và người dùng xác nhận nghiệp vụ ngoài app; không dùng làm hệ thống xác thực Gmail/khôi phục mật khẩu, thông báo push hoặc tra cứu lịch sử công nợ. Cổng còn mở: phát hành commit chốt, áp và xác minh migrations 0011–0013 cùng app migration state, kiểm tra đăng nhập/booking/quyền theo vai trò trên Production, cấu hình và thử OAuth/email/Push Production, và chốt quy trình phục hồi ứng dụng trước khi coi là bàn giao vận hành.

### Cập nhật lần 63 — rà soát tốc độ mở trang (09/11/2026)

- Đo trực tiếp từ máy làm việc, chưa đăng nhập: `/login` lần đầu 1.624 ms, hai lần sau 124–126 ms (CDN `HIT`); `/orders` trả redirect đăng nhập 359 ms rồi 118–137 ms; `/api/health` lần đầu 2.218 ms, hai lần sau 586–587 ms (`MISS`, có truy vấn DB). Đây không phải phép đo booking page sau đăng nhập; cần đo lại bằng trình duyệt đã đăng nhập sau khi phát hành.
- Đọc code thấy workspace layout và trang `/orders` gọi lặp `getSession()` và `getAppSettings()` trong cùng lần render; bảng booking tải tối đa 2.000 booking và toàn bộ khách hàng đang hoạt động. Theo hướng dẫn Next.js 16 trong `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`, dùng React `cache` để khử lặp truy vấn ORM trong một render pass.
- Đã bọc `getSession` và `getAppSettings` bằng React `cache` ở source local để giảm truy vấn lặp trong request; cache chỉ theo request, không chia dữ liệu đăng nhập/cài đặt giữa người dùng. Chưa chạy test/typecheck theo yêu cầu hiện hành và chưa deploy nên Production chưa được hưởng thay đổi này.
- [x] Triển khai cục bộ phân trang booking, hiện đặt 20 dòng mỗi trang, lọc trạng thái và tìm booking/khách/địa chỉ ở truy vấn server; tổng số và KPI lấy aggregate cho cả ngày. Bộ chọn khách không tải toàn bộ danh bạ, tìm tối đa 30 kết quả qua `/api/customers/lookup` sau khi nhập ít nhất 2 ký tự; NVKD chỉ tìm khách được giao hoặc chưa giao. Không thêm migration.
- [ ] Sau khi phát hành, đo bằng tài khoản thật: thời gian render lần đầu và tải lại, số booking/khách gửi về, thời gian API/truy vấn DB, cold vs warm start. Chưa có phép đo lại trên deployment; Production chưa đổi.

### Cập nhật lần 64 — phân trang dữ liệu booking (09/11/2026)

- [x] Trang booking hiện chỉ tải tối đa 40 dòng; điều hướng Trước/Tiếp, tìm kiếm và trạng thái được áp dụng phía server và giữ trong URL. Bảng điều phối, quyền NVKD, bộ lọc ngày/view và xuất XLSX toàn ngày được giữ nguyên phạm vi.
- [x] KPI/tổng số booking vẫn tính trên toàn bộ ngày/view bằng aggregate DB, không phụ thuộc trang đang xem. Bộ chọn khách truy vấn theo chữ nhập, tối đa 30 kết quả; không tải danh bạ lúc mở trang. API lọc quyền NVKD theo khách được giao/chưa giao.
- [x] Kiểm tra `npm run typecheck`, `npm run lint`, `npm run build` và `git diff --check`: đều đạt ngày 09/11. Build production local hoàn tất trong 83,57 giây.
- [x] Browser benchmark trên PostgreSQL local tạm, dữ liệu giả lập 2.500 booking + 2.500 khách: 5 lần mở trang, lần đầu tới bảng 259 ms; trung vị 4 lần tải ấm 133,5 ms (làm tròn 134 ms); response body trang 62.244 byte; bảng render 40 dòng. Tìm booking tới bảng 82 ms; API tìm khách 12 ms, trả tối đa 30 khách/4.019 byte; không có lỗi trình duyệt.
- [x] So sánh số liệu tuần tự hóa local: mô hình cũ (2.000 booking + 2.500 khách) 2.065.066 byte JSON; trang mới (40 booking, không gửi danh bạ ban đầu) 34.249 byte booking JSON, giảm xấp xỉ 98%. Đây là so sánh JSON local, không phải so sánh HTTP nén trên Vercel.
- [ ] Đo lại sau khi có deployment mới trên Preview và DB cô lập: thời gian mạng/cold start/serverless và tải trên thiết bị người dùng. Deployment Preview đang có chạy commit cũ; không tải thử Production. Chưa push/deploy.
- [ ] Đã dừng server và PostgreSQL benchmark; thư mục dữ liệu giả lập còn ở `D:\Temp\cencom-perf-1794194151-719786` vì chính sách workspace chặn thao tác xóa đệ quy. Đây chỉ là cụm DB local cô lập, không chứa dữ liệu Production; cần xóa thư mục này thủ công nếu muốn dọn sạch máy.

### Cập nhật lần 65 — giảm trang booking còn 20 dòng và rà điều kiện Preview (09/11/2026)

- [x] Đổi giới hạn từ 40 xuống **20 booking/trang** trong trang `/orders`; phân trang server, lọc, tìm kiếm và aggregate giữ nguyên.
- [x] Rà cấu hình môi trường Vercel không giải mã secrets: `PREVIEW_DATABASE_URL` và `PREVIEW_DATABASE_ENDPOINT_ID` được ghim theo Git branch `codex/cencom-owner-preview`; cấu hình DB Preview chung và cấu hình theo nhánh cùng tồn tại. Deployment Preview gần nhất (`5c34d73`) là code cũ, không có thay đổi 20 dòng.
- [ ] Chưa tạo deployment mới để xem: Neon tab hiện đang ở dự án `neon-cinnabar-bucket`, nhánh `main`; chưa chứng minh project/endpoint hiện tại khớp với URL DB ghim cho Vercel Preview. Build Preview tự chạy migration nên không deploy khi chưa đối chiếu được DB cô lập với endpoint. Không đụng Production.
- [ ] Sau khi cấu hình Preview trỏ tới endpoint cô lập đang dùng và xác minh đúng project/branch, deploy Preview để kiểm tra giao diện 20 dòng và benchmark mạng/DB trực tiếp.

### Cập nhật lần 66 — Production deploy thử, lỗi schema và rollback (09/11/2026)

- [x] Gửi working tree local từ `main` lên Production deployment `dpl_7bFpNSKrgoVezRV78mcvxAE2AJdb`; Vercel build đạt `READY`, không tự chạy migration theo `scripts/vercel-build.mjs`.
- [x] Browser smoke phát hiện `/orders` lỗi `Better Auth` vì Production DB thiếu cột `user.is_platform_owner` (Postgres `42703`). Migration liên quan là `drizzle/0013_platform_owner.sql` (thêm cột mặc định false và unique partial index).
- [x] Không áp migration vì lệnh guarded từ máy local không khớp endpoint Production; `vercel env run` báo hai secret không thể tải về, guard `verify-production-database.mjs` đã chặn trước khi chạy SQL. Không đọc/ghi database bằng URL khác.
- [x] Rollback alias Production về deployment ổn định `dpl_GEzr5DWujDfgerJE2iompH5PQuHU`; browser xác nhận `/orders` mở lại. Production hiện không chạy giới hạn 20 dòng.
- [x] Đo Production sau rollback bằng phiên trình duyệt đã đăng nhập, ngày 09/11 không có booking: 3 lượt tải hoàn chỉnh mất 3.064, 3.292 và 3.084 giây (trung vị 3.084 giây). Đây là mã cũ và ngày không có dòng; không phải benchmark tải booking 20 dòng.
- [ ] Đang chờ người dùng nhập mã xác minh trực tiếp tại tab Vercel đang mở. Browser policy chặn đọc Gmail trong phiên này; Gmail connector không cung cấp nội dung mã. Không gửi mã vào chat. Sau khi xác minh, đối chiếu endpoint Production với Neon, áp migration cần thiết qua đích đã xác minh, redeploy 20 dòng và đo lại.
