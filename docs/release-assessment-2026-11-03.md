# Đánh giá phát hành 03/11/2026

> Các bảng và kết quả ban đầu là ảnh chụp tại ngày 03/11/2026. Những cập nhật đánh số bên dưới ghi tiến triển theo thời gian; trạng thái hiện hành ở Cập nhật lần 35 (05/11/2026) thay thế nhận định cũ về Preview, Browser, Android toolchain, load test và điểm sẵn sàng.

## Phạm vi

Đợt này hoàn thiện luồng đặt booking, tiếp nhận đơn theo ngày, chuyển đơn đã chốt sang bảng kế hoạch, xuất bảng XLSX tiếng Việt, quản lý danh mục an toàn cho Admin, nhập danh mục kỹ thuật và theo dõi chỉ số hệ thống. Kế toán cân hàng được giữ cho giai đoạn 2.

## Điểm theo giai đoạn

| Giai đoạn | Điểm | Bằng chứng và giới hạn |
| --- | ---: | --- |
| Quy trình nghiệp vụ | 90% | Booking, nhận đơn, chốt sang kế hoạch, hạng mục đổ và danh mục cấu hình đã có. Chưa kết nối dữ liệu cân. |
| Giao diện và khả năng dùng | 84% | Desktop lưới kế hoạch, mobile booking/PWA, tab cài đặt và hướng dẫn trạng thái catalog. Cần khách hàng nghiệm thu workbook gốc và dữ liệu thật. |
| API, quyền và dữ liệu | 88% | RBAC server-side, migration versioned, audit cho thay đổi Admin, catalog cũ được chuẩn hóa. Chưa có backup/restore diễn tập và rate limit chia sẻ giữa các instance. |
| UAT và chất lượng mã | 87% | 53/53 unit tests; typecheck, lint, build đạt; local PostgreSQL UAT độc lập Production. Chưa có browser E2E tự động cho toàn bộ vai trò. |
| Tốc độ | 82% | Local /api/health trả HTTP 200; 7 mẫu đo: lần đầu 56.8 ms, các lần ấm 12.5–16.6 ms; DB query hiển thị 3 ms. Mẫu nhỏ trên máy local, không đại diện p95 Production hay tải đồng thời. |
| Sẵn sàng vận hành | 78% | CI GitHub Actions và Vercel Git Integration; migration additive đã áp trên Neon Production. Preview đang thiếu Neon DATABASE_URL riêng nên deployment Preview thất bại có chủ đích. |

**Mức hoàn thiện giai đoạn hiện tại: 85%.** Đây là đánh giá nội bộ theo phạm vi sản phẩm, mã, UAT và vận hành; không phải cam kết SLA hay mức tải đã kiểm thử. Các mục còn lại tập trung vào thiết lập Preview DB an toàn, E2E browser, backup/restore drill và nghiệm thu với dữ liệu thật.

## Kết quả kỹ thuật

- npm run typecheck: đạt.
- npm run lint: đạt.
- npm test: 53/53 đạt.
- npm run build: đạt với Next.js 16.4.3.
- npm audit --omit=dev --audit-level=moderate: 0 lỗ hổng.
- npm run db:migrate:dry trên Production xác nhận đúng Neon Production; migration 0005–0009 được áp thành công, còn lịch sử 0000–0004 được bỏ qua.
- Health endpoint Production đã được kiểm tra sau khi Vercel hoàn tất deployment; kết quả đo được ghi ở phần trên.

- GitHub Actions `CI` cho commit phát hành hoàn tất `success` (typecheck, lint, tests và production build).
- Vercel Production deployment của `main` ở trạng thái `READY`; alias đang dùng là `kdbt-app-dat-hang-five.vercel.app`.
- Sau phát hành, `/api/health` trả `status: ok`, `database: up` trong cả 3 lần đo. Thời gian tổng lần lượt 2.58s, 0.88s, 0.65s; lần đầu JSON báo query database 1.53s. Chênh lệch giữa lần đầu và các lần kế tiếp cho thấy cần tiếp tục theo dõi cold start/Neon wake-up.

## Nhận xét kiến trúc và rủi ro

- Giữ PostgreSQL/Neon là nguồn dữ liệu chuẩn. Chưa thêm Redis vì chưa thấy nhu cầu cache chia sẻ hoặc hàng đợi; giới hạn đăng nhập in-memory chỉ phù hợp tải nhỏ và phải đổi sang giải pháp chia sẻ trước khi mở rộng SaaS.
- GitHub Actions làm quality gate; Vercel Git Integration chỉ làm deployment để tránh hai pipeline deploy trùng nhau.
- Số băng thông trong tab Hệ thống là ước lượng client-side từ Browser Resource Timing, không phải Vercel CDN egress. Admin được xem page views, số người dùng, query DB và trạng thái deployment.
- Migration 0009 giữ lựa chọn đang có và bổ sung danh mục mặc định bị thiếu. Danh sách phương tiện phục vụ vẫn để trống khi chưa được Admin cấu hình, tránh gán loại xe giả.
- Không tạo booking, khách hàng hoặc dữ liệu kế toán giả trên Neon Production.

## Việc cần làm tiếp

1. Cấu hình Neon Preview Branch riêng và thêm DATABASE_URL Preview; tuyệt đối không dùng lại URL Production.
2. Bổ sung browser E2E cho NVKD tạo booking, Kế hoạch tiếp nhận/chốt/xếp lịch, Admin sửa danh mục, Kế toán ghi nhận và xuất XLSX.
3. Diễn tập backup/restore Neon và quy trình rollback deployment.
4. Admin xác nhận danh mục bê tông/phương tiện thực tế; nhân sự nhập dữ liệu khách hàng và tài khoản thật sau UAT.
5. Giai đoạn 2: tích hợp file cân offline theo định dạng xuất do nhà cung cấp cân xác nhận.

## Cập nhật lần 2 — thông báo, tải đồng thời và chuẩn bị phát hành

### Điểm tự đánh giá

| Hạng mục trong đợt này | Hoàn thiện | Bằng chứng / phần còn lại |
| --- | ---: | --- |
| Đọc checklist deploy, quy trình release và rà soát repo | 90% | Checklist đã thêm vào repo; đã xác nhận nhánh, tag, Vercel project và trạng thái biến Preview/Production. Chưa hoàn tất đối chiếu trên GitHub/Vercel do quyền trình duyệt của phiên bị chặn. |
| Kết nối đồng thời và giới hạn pool DB | 85% | Pool mặc định 2 kết nối mỗi instance, cho phép cấu hình có chặn trần 20; booking dùng khóa chia sẻ, cập nhật booking có version chống ghi đè. Đã đo API health trên PostgreSQL local, chưa đo trên Neon/Vercel. |
| Hộp thư thông báo theo vai trò và chọn người gửi | 95% | Booking mới được ghi cùng giao dịch với booking; khi kế hoạch duyệt/cập nhật, NVKD nhận tin của booking mình. UAT xác nhận Admin/Kế hoạch chỉ thấy tùy chọn đơn mới, NVKD chỉ thấy tùy chọn cập nhật đơn. |
| Web Push/PWA trên Android | 75% | Service worker và đăng ký push đã có; chưa đặt VAPID keys trên Vercel nên hiện mới xác nhận hộp thư trong app. Chưa thử push trên thiết bị Android thật. APK không cần thiết cho luồng push dự kiến: PWA có thể nhận push qua service worker khi app không mở, sau khi cấu hình khóa và quyền thông báo. |
| CI/CD và kiểm tra chất lượng | 90% | GitHub Actions chạy cài sạch, typecheck, lint, unit test, dependency audit và build; đã mở rộng cho PR/nhánh feature/release. Workflow chưa chạy trên GitHub vì thay đổi chưa được đẩy lên. |
| Deploy Preview/Production | 45% | Production `main` vẫn ở commit `6a41287` / tag `v1.1.0`. Vercel Preview chưa có `DATABASE_URL`; nhánh Neon `develop-preview` tồn tại nhưng được tạo từ `main` và mới ghi nhận migration tới `0004`, nên chưa dùng làm UAT cho tới khi xác minh/mask dữ liệu và chạy dry-run. Chưa xác minh điểm khôi phục Production. |

**Hoàn thiện phần code của yêu cầu đợt này: 86%.** Đây là điểm nội bộ cho chức năng và kiểm thử local; **không phải** tỷ lệ sẵn sàng Production. Sẵn sàng triển khai Production hiện ở mức **45%** do các cổng Preview, dữ liệu, backup và quyền truy cập Vercel chưa đạt.

### Kết quả kiểm tra mới

- Bản sao sạch tại `D:\Temp\cencom-release-check-9ea64fa0227c49b3b3ccc08db4441120`: `npm ci` thành công; `npm run typecheck`, `npm run lint`, `npm test` (58/58), `npm audit --omit=dev --audit-level=moderate` (0 lỗ hổng) và `npm run build` (Next.js 16.4.3) đều đạt. Build dùng biến CI giả, không truy cập DB Production.
- Browser UAT trên PostgreSQL local riêng: NVKD đăng nhập, lưu bộ lọc người gửi, tạo `BOOK-7453`; Kế hoạch nhận đơn theo ngày và duyệt; NVKD nhận thông báo xác nhận; Admin mở được trang thiết lập. Không có lỗi console/page. Thời gian các thao tác: lưu thiết lập 74 ms, tạo booking 73 ms, duyệt 130 ms; đăng nhập 155–193 ms trong lượt cuối. Ảnh: `D:\Temp\cencom-uat-4dbd57e5`.
- Load test chỉ đọc `/api/health`, không tạo booking: 25 kết nối trong 10 giây đạt 7.714 yêu cầu, p50 32 ms, p95 51 ms, 0 lỗi; 50 kết nối đạt 9.366 yêu cầu, p50 51 ms, p95 76 ms, 0 lỗi. Đây là máy local + PostgreSQL local, không dự báo thông lượng Neon/Vercel.
- Migration `0010_notification_preferences_and_push.sql` dry-run trên DB local riêng cho thấy toàn bộ `0000`–`0010` đã được áp; không áp migration nào lên Neon Production hoặc Preview.

### Tính tải đồng thời và vận hành

`DB_POOL_MAX` mặc định là 2 cho mỗi instance serverless. Số kết nối tối đa ước lượng là `số instance đồng thời × pool max`: 10 instance → 20 kết nối; 25 → 50; 50 → 100. Trần cấu hình mỗi instance hiện là 20, nhưng cần giữ thấp cho đến khi đối chiếu giới hạn pooler/compute của Neon. Load test local ở trên đo 25/50 request đồng thời tới health endpoint, không mô phỏng 50 người đồng thời sửa cùng một booking.

Chưa thêm Redis: hiện chưa có cache chia sẻ hay hàng đợi cần Redis; thêm dịch vụ khi chưa đo nhu cầu sẽ tăng cấu hình và điểm lỗi. Tuy vậy, Better Auth đang giới hạn đăng nhập trong bộ nhớ từng instance, không chia sẻ giữa các instance. Trước khi mở SaaS rộng hoặc dựa vào giới hạn đăng nhập như một kiểm soát chống brute-force, cần chuyển rate limit sang kho chia sẻ như Upstash Redis và thử tải lại.

PWA là lựa chọn phù hợp cho Android ở giai đoạn này. API Push cần HTTPS, service worker, khóa VAPID, quyền thông báo của người dùng và endpoint được đăng ký; chưa có khóa môi trường nên chưa thể nhận push ngoài thực tế. [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API), [MDN: hoạt động nền của PWA](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation).

### Cổng còn mở trước khi deploy (ảnh chụp lịch sử ngày 03/11)

Danh sách tại thời điểm này đã được thay thế bởi Cập nhật lần 12 bên dưới. Những điểm đã thay đổi sau ảnh chụp gồm: Vercel Browser mở được, Preview DB riêng đã được xác minh, migration `0010` đã có trên Preview và VAPID đã cấu hình riêng cho Preview. Các cổng Production, load test Preview liên tục, push trên Android thật và APK vẫn chưa đạt.

Không có dữ liệu thử, secret, connection string hoặc token nào được thêm vào Git. `main`, alias Production và dữ liệu Neon Production không bị thay đổi trong lượt này.

### Cập nhật lần 3 — xác minh Preview cô lập và cổng khôi phục Production

- Neon Preview dùng project `cencom-preview-isolated`, endpoint Singapore riêng, có marker accounts UAT; không kết nối Neon `main` hoặc dữ liệu Production.
- Vercel Preview deployment `dpl_4ZU4ZsXvCWAz2dSmsZNMCuV6hbYr` ở trạng thái `READY`, `productionUrl: null`, có Vercel Authentication. Build kết nối đúng Neon Preview và migration runner báo 0000–0010 đã áp, 0 migration mới. Deployment build này không phải lệnh dry-run tường minh.
- Browser UAT trên deployment mới đăng nhập Admin UAT, tải bảng kế hoạch với `BOOK-7431` đã xác nhận và `BOOK-7432` chờ duyệt; hộp thư hiển thị thông báo `BOOK-7432` cho Admin. Luồng NVKD → Kế hoạch → Admin đã được kiểm tra trên Preview deployment trước đó cùng Preview DB.
- Sửa phản hồi API booking khi lựa chọn danh mục không hợp lệ: trả HTTP 409 và nêu tên trường tiếng Việt cần tải lại. Typecheck, lint, 58/58 unit tests và `npm audit --omit=dev --audit-level=moderate` (0 lỗ hổng) đạt sau thay đổi; Preview build thành công.
- Load test trực tiếp Preview chưa chạy: deployment đang yêu cầu Vercel Authentication, còn harness cần phiên xác thực. Không dùng bypass token hoặc giảm bảo vệ. Kết quả load test local trước đó không đại diện Preview.
- Dry-run migration tường minh đã chạy sau đó trên Neon Preview cô lập: 0000–0010 đều được nhận diện là đã áp; “Dry-run xong, chưa ghi gì.”
- Neon Production `main` trong project `neon-cinnabar-bucket` hiển thị history/PITR 6 giờ; trang Backup & Restore báo không có snapshot và không có lịch snapshot. Mức lưu lịch sử này chưa đủ để xác nhận phương án khôi phục vận hành. Chưa thực hiện restore hoặc thay đổi gì trên Production.
- Đối chiếu thông tin Neon hiện hành: Free có Instant Restore tối đa 6 giờ hoặc 1 GB thay đổi (ngưỡng nào đến trước); Neon Snapshots có thể khôi phục vào branch mới mà không sửa branch nguồn. Tài liệu sản phẩm: [Free plan/PITR](https://neon.com/blog/neon-free-plan-1-gb-per-project), [Snapshots và khôi phục](https://neon.com/blog/three-ways-to-use-your-snapshots). Đề xuất trước khi release Production: thống nhất RPO, bật retention phù hợp và snapshot trước migration; lên lịch snapshot nếu gói/tài khoản hỗ trợ. Chưa đổi gói, tạo snapshot hay khôi phục vì đây là thao tác trên dữ liệu Production.
- Vercel có deployment trước đó `dpl_22ezfdANsFE1tzpchJMwo2z4xrKf` (commit `ecd9ddf`, `READY`) làm ứng viên rollback. CLI xác nhận cơ chế `vercel promote <deployment-id|url>` để promote deployment có sẵn. Chưa chạy lệnh này vì sẽ đổi alias Production; cơ chế đã được xác định nhưng chưa diễn tập.
- Đã tạo VAPID key pair riêng và thêm `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY` (Secret) cùng `WEB_PUSH_VAPID_SUBJECT` (Config) chỉ vào Vercel Preview; Production chưa có khóa. Deployment `dpl_7yZksBnUG8p4uVZxeA2u95dRTxdE` ở trạng thái READY, build nhận đúng DB Preview và hộp thiết lập hiện nút bật push. Thử trên cả Browser tích hợp và Chrome desktop đều dừng ở trạng thái “đang lưu”; Chrome báo `Notification.permission` còn `default`, sự kiện xin quyền không xuất hiện trong quan sát CDP, nên chưa có subscription và chưa chứng minh gửi/nhận push. Browser Use chặn mở `chrome://settings/content/notifications`; không dùng đường khác để né chính sách. Cần cấp quyền bằng thao tác Chrome bình thường rồi thử lại.
- `ANDROID_HOME` và `JAVA_HOME` cũ trỏ tới thư mục không tồn tại; khi đó chưa tìm thấy Android Studio/SDK và Bubblewrap. Theo xác minh tài liệu Bubblewrap mới nhất ở lần cập nhật 6, hướng dẫn cài TWA hiện yêu cầu JDK 17, không mặc định JDK 21.

**Trạng thái phát hành:** chưa mở PR, chưa push nhánh, không thay đổi `main`/Production. Các cổng bắt buộc còn mở: load test Preview có phiên xác thực hợp lệ, tăng PITR/tạo snapshot theo RPO đã thống nhất rồi diễn tập khôi phục Production an toàn, diễn tập rollback Vercel ở thời điểm release, khắc phục/cấp quyền push bằng thao tác trình duyệt bình thường, xác nhận push trên Android thật và chuẩn bị APK theo roadmap. Chỉ tiếp tục phát hành sau khi các cổng này đạt. Không có secret, URL kết nối hoặc mật khẩu nào được ghi vào repo.

### Cập nhật lần 4 — xử lý trạng thái chờ xin quyền Push

- `src/components/notification-settings.tsx` hiện giới hạn yêu cầu `Notification.requestPermission()` trong 30 giây; nút thể hiện “Đang chờ quyền từ trình duyệt…” và báo cách xử lý nếu trình duyệt không phản hồi.
- `npm run typecheck`, `npm run lint`, `npm test` (58/58) và `npm run build` đạt. Preview deployment `dpl_6LUB6QziC5iQqut8cGiecVHMKNyo` ở trạng thái `READY`.
- Browser UAT đăng nhập Admin trên deployment mới, bấm bật push, đợi đủ 30 giây và xác nhận nút thoát trạng thái chờ, hiện hướng dẫn cấp quyền. Quyền Chrome vẫn `default`; không tạo subscription và chưa xác nhận gửi/nhận push.
- Chưa commit/push/PR; không thay đổi Neon Production, Vercel Production hoặc `main`.

### Cập nhật lần 5 — xác minh phương án tải Preview có bảo vệ

- Kiểm tra `vercel --help` và `vercel curl --help` của Vercel CLI 64.7.0. `vercel curl` nêu rõ chức năng tự động bypass Vercel Deployment Protection; tuỳ chọn `--protection-bypass` cũng nhận secret bypass. Không dùng lệnh này vì Preview đang được bảo vệ và quy trình yêu cầu không né lớp bảo vệ.
- Harness `scripts/load-test.mjs` chỉ nhận cookie qua `LOAD_TEST_COOKIE`; không có tích hợp với phiên đăng nhập Vercel/Chrome đang mở. Không trích xuất cookie phiên từ trình duyệt. Do đó chưa có phương án tải trực tiếp Preview phù hợp chính sách hiện tại; cần quản trị viên cấp một phương thức UAT/load-test được phê duyệt, giới hạn vào Preview và không làm suy giảm bảo vệ deployment.
- Chỉ thực hiện tra cứu trợ giúp CLI, không gửi request tới Preview, không dùng bypass secret/token và không thay đổi cấu hình Vercel, Neon, Production hay `main`.

### Cập nhật lần 6 — chuẩn bị Android build toolchain

- Đã tải Temurin JDK 17.0.20.1 từ Adoptium và Android command-line tools Windows từ Android Developers vào `E:\dev\cencom-android-toolchain`; SHA-256 cả hai gói khớp checksum công bố chính thức. Giải nén JDK và dựng cấu trúc `android-sdk\cmdline-tools\latest`; `java -version` xác nhận JDK 17.0.20.1, `sdkmanager --version` nhận 22.0.
- Bubblewrap CLI 1.27.0 đã cài global cho user (không thêm dependency vào repo). Đã cấu hình `C:\Users\Admin\.bubblewrap\config.json` trỏ tới JDK 17 và SDK. Do Bubblewrap tìm `bin/sdkmanager` trong SDK root nhưng Android command-line tools hiện đặt nó ở `cmdline-tools/latest/bin`, thêm `android-sdk\bin\sdkmanager.bat` wrapper chuyển tiếp tới công cụ thật. `bubblewrap doctor` xác nhận cả hai đường dẫn hợp lệ.
- Đã cài `platform-tools` 37.0.1, `platforms;android-36` và `build-tools;36.1.0`, đúng compile/target SDK 36 và build-tools mà template Bubblewrap 1.27.0 hiện yêu cầu. `adb version` chạy được. Sau khi được người dùng cho phép, chỉ chấp nhận `android-sdk-license` cần cho các gói này; không ghi nhận license Google TV/XR.
- Các biến môi trường cấp user `JAVA_HOME`, `ANDROID_HOME`, `ANDROID_SDK_ROOT` và PATH trước đó trỏ tới thư mục không tồn tại; đã cập nhật sang toolchain ở `E:\dev\cencom-android-toolchain`. Shell mới nhận `java`, `adb`, `sdkmanager`, `bubblewrap`; `bubblewrap --version` là 1.27.0 và `bubblewrap doctor` đạt.
- SDK Manager 22.0 phát cảnh báo CLI `sdkmanager` đã deprecated và khuyến nghị Android CLI mới. Bubblewrap vẫn chạy doctor được; cần kiểm tra lại tương thích khi sinh project/build. Chưa tạo APK/keystore và chưa kiểm thử thiết bị; APK vẫn chờ giai đoạn 0, Preview/UAT, backup/rollback và Push trên Android thật.
- Lệnh Bubblewrap ban đầu tự hỏi cài JDK; đã thoát prompt, không cài trùng. Một lần ghi config PowerShell có BOM khiến JSON parse thất bại; đã ghi lại UTF-8 không BOM. Không thay đổi file dependency của repo.

### Cập nhật lần 7 — đồng bộ tài liệu kiến trúc và triển khai

- `docs/architecture.md` và `docs/implementation-plan.md` trước đó vẫn ghi Preview thiếu `DATABASE_URL`, có 53 tests và Web Push chưa triển khai. Đã đồng bộ với bằng chứng hiện có: Preview Neon cô lập, migrations `0000`–`0010`, deployment mới nhất READY, 58 tests và Web Push đã có code.
- Tài liệu vẫn nêu rõ các xác minh chưa đạt: browser E2E tự động, load test Preview có xác thực được phê duyệt, gửi/nhận Push trên Android thật, restore/PITR drill và rollback Vercel. Không nâng mức sẵn sàng Production chỉ dựa vào cập nhật tài liệu.

### Cập nhật lần 8 — xác nhận inbox Preview và Android toolchain

- Mở deployment Preview `dpl_6LUB6QziC5iQqut8cGiecVHMKNyo` trong trình duyệt tích hợp ở phiên đăng nhập Admin UAT.
- Trong Vercel dashboard, deployment đang `Ready`, môi trường `Preview`, nhánh `feature/notifications-scale-android`, commit `ca9dce2`. Danh sách biến cho thấy `DATABASE_URL` và ba biến `WEB_PUSH_VAPID_*` chỉ gắn nhãn Preview; các biến Neon integration đang gắn nhãn Production. Chỉ đọc tên/nhãn, không reveal hoặc sao chép giá trị. Trang `/orders` tải thành công, hiển thị 0 booking ngày 04/11/2026; inbox `/notifications` tải thiết lập và hiện một thông báo chưa đọc `BOOK-7432` do Admin UAT tạo ngày 03/11/2026. Admin thấy tùy chọn nhận booking mới và bộ lọc người gửi NVKD UAT. Đây là kiểm tra UI/inbox trên Preview, không xác nhận gửi push ngoài app.
- Chưa cấp quyền Notifications cho Preview trong trình duyệt và chưa bấm bật push; không có subscription mới hay bằng chứng push nhận được. Theo cập nhật trước, VAPID đã cấu hình riêng cho Preview; Production chưa có khóa. Cần kiểm tra end-to-end trên Chrome Android/thiết bị thật sau khi người dùng cấp quyền theo thao tác trình duyệt bình thường.
- Theo cho phép rõ ràng của người dùng, chấp nhận giấy phép Android SDK cần cho các gói platform/build-tools đã chọn. Kiểm tra lại JDK 17.0.20.1, ADB 37.0.1, `platforms;android-36`, `build-tools;36.1.0`, Bubblewrap 1.27.0; `bubblewrap doctor` báo JDK và Android SDK path hợp lệ. SDK Manager 22.0 vẫn cảnh báo CLI cũ/deprecated; toolchain chưa được dùng để tạo APK.
- Load test Preview vẫn chưa chạy vì deployment có Vercel Authentication và harness cần cookie. Không dùng `vercel curl`, bypass token hoặc trích cookie phiên trình duyệt. Cần phương thức được quản trị viên phê duyệt và giới hạn Preview.
- Không đổi cấu hình, dữ liệu hoặc alias Production; không thay đổi `main`, không tạo PR, không push/merge. Các cổng PITR/backup và restore Production, diễn tập rollback Vercel, push Android thật và tải Preview có xác thực được phê duyệt vẫn chưa đạt.
### Cập nhật lần 9 — đối chiếu trạng thái hiện tại 04/11/2026

- Mở được Vercel Dashboard bằng Browser tích hợp trong chat này; project/team đúng. Deployment Preview `dpl_6LUB6QziC5iQqut8cGiecVHMKNyo` là `Ready`, branch `feature/notifications-scale-android`, commit `ca9dce2`. Dashboard chỉ gắn `DATABASE_URL` và `WEB_PUSH_VAPID_*` vào Preview; biến Neon integration Production vẫn gắn `Production`. Không mở giá trị bí mật.
- Neon Console cho thấy hai project tách rời: `cencom-preview-isolated` và `neon-cinnabar-bucket`. Chạy truy vấn `SELECT filename FROM _app_migrations ORDER BY filename` chỉ đọc trên branch `main` của project Preview cô lập; kết quả đủ 11 migration `0000`–`0010`, gồm `0010_notification_preferences_and_push.sql`. Chữ `main` ở đây là branch mặc định của project Preview riêng, không phải Neon Production `main`.
- Trên Neon Production `neon-cinnabar-bucket/main`, trang Backup & Restore hiện tại chỉ có history/PITR 6 giờ; không có snapshot và không có lịch snapshot. Project vẫn Free. Đây chưa đáp ứng một quy trình khôi phục đã diễn tập theo RPO; không nâng gói, tạo snapshot, chạy restore hoặc thay đổi Production trong lượt này.
- `vercel list kdbt-app-dat-hang --environment production --json --limit 10` xác nhận Production hiện ở `6a41287` và deployment trước `ecd9ddf` vẫn `READY` tại `https://kdbt-app-dat-hang-8pi1fzued-vohanh19902026-droid.vercel.app`. CLI 64.7.0 hỗ trợ `vercel rollback <deployment-url|id>` và `vercel rollback status`; lệnh status hiện báo không có rollback đang chạy. Chưa chạy rollback vì thao tác đó sẽ đổi alias Production; cần kiểm tra tương thích schema/app và diễn tập có kiểm soát trước release.
- Trên source local hiện tại: `npm run typecheck`, `npm run lint`, `npm test` (58/58), `npm audit --omit=dev --audit-level=moderate` (0 lỗ hổng) và `npm run build` (Next.js 16.4.3) đều đạt. Các thay đổi source còn local chưa được đẩy lên; chưa có CI GitHub cho trạng thái này.
- Preview UAT browser xác nhận Admin đọc được inbox có `BOOK-7432` và thiết lập lọc người gửi; Vercel Preview vẫn yêu cầu xác thực cho tải từ harness. Không tạo share link 23 giờ, không dùng bypass token, không trích cookie. Load test Preview còn chờ phương thức truy cập được chấp thuận mà không mở rộng người xem deployment.
- Cập nhật điểm/tiêu chuẩn: mức code và local QA đạt khoảng 86% như đánh giá phạm vi hiện tại; chưa đủ bằng chứng để chấm readiness Production ở mức 85–90%. Các cổng còn thiếu là load test Preview hợp lệ, RPO/backup và restore drill Production, diễn tập rollback, Push trên Android thật, và hoàn tất APK theo roadmap. Chỉ mở PR/push/triển khai sau khi các cổng bắt buộc được giải quyết.
### Cập nhật lần 10 — kiểm tra PWA/TWA và quyền truy cập assetlinks

- Trên domain Production, Web Manifest có `start_url: /`, `display: standalone` và icon 192/512. Request `/.well-known/assetlinks.json` hiện bị chuyển về `/login`; repo chưa có file này, nên TWA chưa xác minh domain và chưa thể xác nhận mở full-screen.
- Đã sửa `src/proxy.ts` ở working tree để allowlist chính xác `/.well-known/assetlinks.json` như endpoint công khai. Production chưa nhận thay đổi này. Build local sau chỉnh sửa trả 404 không redirect (file chưa có), kiểm tra phù hợp mục tiêu xác nhận proxy không chặn assetlinks; nội dung JSON và fingerprint vẫn chờ applicationId/certificate ký được chốt.
- Sau chỉnh sửa proxy, `npm run lint`, `npm test` (58/58), `npm audit --omit=dev --audit-level=moderate` (0 lỗ hổng), `npm run build` và `npm run typecheck` chạy tuần tự đều đạt. Typecheck lần chạy đồng thời với build ban đầu báo thiếu file sinh trong `.next/types`; chạy lại sau build đạt.
- `adb devices -l` không thấy thiết bị Android; chưa tạo APK/keystore. Domain verification, push trên Android và build TWA vẫn chưa nghiệm thu.
### Cập nhật lần 11 — probe tải Preview bằng phiên trình duyệt thường

- Dùng tab trình duyệt đã đăng nhập bình thường vào Preview để mở `/api/health`; không tạo share link, không dùng bypass và không trích cookie. Chạy hai đợt reload song song, mỗi đợt 10 tab: tổng 20 GET, tất cả phản hồi `status: ok`, `database: up`, 0 lỗi. Latency DB do endpoint tự báo: p50 219 ms, p95 220 ms, max 1.540 ms (lượt đầu lạnh); thời gian mỗi đợt reload qua browser automation là 9.037 giây và 7.351 giây.

- Giới hạn: đây là hai burst nhỏ qua browser, không phải bài chạy tải liên tục 10 giây từ harness. Browser automation điều phối reload chậm và endpoint trả dữ liệu JSON nên chưa đo throughput/p95 Vercel bằng harness. Tiếp tục giữ trạng thái load test release-gate là chưa đạt cho tới khi có đường chạy được phê duyệt, dùng phiên thật mà không mở rộng truy cập deployment.

### Cập nhật lần 12 — rà soát hiện trạng và sửa cổng phát hành

- Vercel Browser tích hợp mở được dashboard trong phiên này, đã đăng nhập đúng team/project. Vì vậy, nhận định cũ rằng quyền Browser đang chặn Vercel không còn đúng. Kết nối Vercel MCP riêng trả `403` yêu cầu tái xác thực team; không dùng MCP/CLI hay cơ chế khác để vượt quyền Browser.
- Dashboard hiện liệt kê Preview `READY` trên branch `feature/notifications-scale-android`, commit `ca9dce2`; deployment mới nhất là `dpl_6LUB6QziC5iQqut8cGiecVHMKNyo` tại hostname kết thúc `d3p3i4sxy`. Đối chiếu Vercel API read-only xác nhận ID, hostname và commit trùng nhau. Production vẫn ở commit `6a41287`. Các sửa đổi local hiện tại chưa có trên Preview.
- GitHub connector không trả status check hoặc workflow run cho commit `ca9dce2`; coi CI từ xa là chưa xác minh. Cần chạy CI cho source đầy đủ sau khi các release gate cho phép đẩy nhánh.
- Vercel Settings gắn `DATABASE_URL` và `WEB_PUSH_VAPID_*` ở Preview; Neon integration variables chỉ gắn Production. Giá trị secret không được mở. Neon Preview ở project riêng và truy vấn trước đó xác nhận migration `0000`–`0010`; không dùng Neon Production `main` làm UAT.
- Phiên Preview trong Browser hiện đăng nhập vai trò `NVKD UAT`; trang Công nợ tải được, danh sách chọn khách hiển thị các tên đánh dấu UAT và không có giao dịch công nợ. Chỉ quan sát, không ghi sổ hay tạo dữ liệu.
- Probe Preview trước đó qua Browser phiên bình thường hoàn tất 20 GET `/api/health` trong hai đợt 10 tab, mọi phản hồi `database: up`. Đây chỉ là smoke/burst probe; load test harness liên tục, throughput và p95 Vercel vẫn chưa được xác minh.
- Source local có ba thay đổi chưa deploy: phản hồi HTTP 409 kèm tên danh mục hết hiệu lực, trạng thái chờ/cảnh báo timeout khi xin quyền Web Push, và allowlist chính xác endpoint `/.well-known/assetlinks.json`. Các kiểm tra local đã ghi ở cập nhật 4 và 10 đạt; không có bằng chứng Preview đã chạy các thay đổi này.
- **Điểm hiện hành:** mức code và local QA khoảng 86% theo rubric nội bộ hiện có. Không chấm readiness Production là 85–90%: các cổng backup/PITR và restore drill, rollback rehearsal, load test Preview liên tục qua đường truy cập được duyệt, push trên Android thật và quyết định định danh/chữ ký TWA còn mở. Không gộp điểm code với điểm sẵn sàng phát hành.
- **Đề xuất tiếp theo:** dùng một đường tải Preview được quản trị viên phê duyệt, giới hạn đúng deployment và không giảm Deployment Protection; thống nhất RPO rồi hoàn tất backup/restore drill trên quy trình tách biệt; yêu cầu người phụ trách thiết bị cấp quyền Notifications bằng thao tác UI bình thường và thử push trên Android thật; chốt `applicationId`/signing owner rồi mới sinh assetlinks và APK. Chỉ mở PR/push/triển khai sau khi release checklist xác nhận đủ cổng.
- Không thay đổi `main`, Vercel Production hoặc Neon Production; chưa mở PR, chưa push, chưa tạo APK/keystore.

### Cập nhật lần 13 — xác nhận lại Android toolchain và CI

- Shell Codex hiện tại còn kế thừa `ANDROID_HOME`/`JAVA_HOME` cũ và `PATH` không có `adb`; kiểm tra phạm vi User cho thấy đã lưu đúng `E:\dev\cencom-android-toolchain\android-sdk` và JDK 17.0.20.1. Đặt biến chỉ cho tiến trình kiểm tra (không sửa biến User) làm `java`, `adb`, `sdkmanager` hoạt động; `bubblewrap doctor` đạt.
- `sdkmanager --list_installed` xác nhận `platform-tools 37.0.1`, `platforms;android-36` và `build-tools;36.1.0`. `adb devices -l` không có thiết bị; Android Emulator chưa được cài, nên chưa thể nghiệm thu APK/Push trên thiết bị. `sdkmanager` cảnh báo CLI cũ/deprecated; Bubblewrap hiện vẫn nhận SDK.
- GitHub connector không trả status check hoặc workflow run cho `ca9dce2`; không coi đây là CI thành công. Bài CI mới cần chạy sau khi được phép đẩy source đầy đủ lên branch.
- Cập nhật `docs/release-process.md` để phản ánh chính xác trigger feature/release và thêm các cổng backup/restore, rollback, Push, TWA và load test được duyệt. Không thay đổi môi trường User, Vercel, Neon hay branch từ lượt kiểm tra này.

### Cập nhật lần 14 — kiểm tra xác thực tải Preview và chặn phản hồi giả

- Trang Vercel Deployment Protection hiển thị Trusted Sources của cùng project cho phép token môi trường `development` truy cập `preview`. Tuy vậy, một request thử bằng `VERCEL_OIDC_TOKEN` lấy từ `vercel env run -e development` trả HTTP 200 nhưng `Content-Type: text/html`, tiêu đề `Login – Vercel`, dung lượng 333.201 byte. Không coi đây là quyền truy cập thành công và không tiếp tục đo tải qua token này.
- Lượt harness 25 concurrency trước đó ghi 241 phản hồi HTTP 200, 0 lỗi nhưng tổng body 80.306.864 byte. Mẫu kiểm tra sau đó xác nhận response HTML Login của Vercel, nên số liệu này không phải kết quả API health và bị loại khỏi báo cáo tải.
- Bằng phiên Browser đăng nhập bình thường, 10 tab Preview reload đồng thời qua hai chu kỳ; 20/20 response đã được đọc và xác nhận JSON `status: ok`, `database: up`, không lỗi. Latency DB do endpoint báo: p50 228 ms, p95 228 ms, max 1.610 ms. Cả hai chu kỳ cùng bước đọc UI mất 16,42 giây; đây vẫn là probe nhỏ qua Browser, chưa phải bài tải liên tục có throughput/p95 đáng tin cậy.
- Sửa `scripts/load-test.mjs`: remote chỉ nhận URL Preview khớp allowlist chính xác, chỉ tải endpoint read-only `/api/health`, yêu cầu OIDC và xác nhận môi trường; kiểm tra body phải là JSON health khỏe. Thử mock local: JSON 200 được tính đạt; HTML 200 bị tính 100% lỗi và exit code 1. `npm run lint` và `node --check` đạt sau sửa.
- **Load test Preview vẫn chưa đạt.** Trusted Sources token không xác thực được qua harness, còn Browser session chỉ hỗ trợ probe nhỏ. Cần Vercel/project owner xác nhận phương thức tải được chấp nhận; không dùng cookie, share link, bypass header/secret hoặc thay đổi Deployment Protection.

### Cập nhật lần 15 — chạy load test Preview bằng OIDC Development mới

- Xác định nguyên nhân token Development cũ trả trang Login: `.env.local` chứa token hết hạn và project claim không khớp project đang liên kết. Lấy token Development mới bằng `vercel env pull` vào file tạm ngoài repo; xác minh claim project, environment và thời hạn trước khi gửi request. Không ghi token/secret vào báo cáo.
- Harness kiểm tra JSON health đã chặn phản hồi HTML Login. Chạy lại trên deployment Preview `dpl_6LUB6QziC5iQqut8cGiecVHMKNyo`, chỉ gọi GET read-only `/api/health`: concurrency 25 trong khoảng 12,77 giây có 157 request, 12,3 RPS, p50 1.810 ms, p95 3.395 ms, 0 lỗi; concurrency 50 trong khoảng 14,98 giây có 302 request, 20,16 RPS, p50 1.366 ms, p95 4.982 ms, 0 lỗi. Tất cả body là JSON health hợp lệ, HTTP 200; loại bỏ hoàn toàn lần chạy token cũ trả HTML.
- Đợt xác nhận wrapper ngắn trên đúng URL Preview thực hiện 1 request JSON hợp lệ, 0 lỗi. Wrapper lấy token mới, kiểm tra project/environment/expiry, giới hạn host và endpoint, khôi phục biến môi trường tiến trình và xóa file tạm trong `finally`. File `.env.local` giữ nguyên thời điểm sửa đổi 2026-11-02; file token tạm cố định được dọn.
- Diễn giải: không có SLA đã thống nhất để kết luận đạt/không đạt theo ngưỡng hiệu năng. p95 3,4–5,0 giây ở hai mức concurrency là cao và cần đánh giá theo mục tiêu sản phẩm, vùng truy cập và tải dự kiến trước khi xem cổng hiệu năng là đạt. Bài này chỉ đo endpoint health read-only trên Preview, không đo các luồng ghi booking hay tải Production.
- SDK command-line license prompt đã được mở tương tác; sau khi người dùng cho phép, chấp nhận các điều khoản đang chờ. `sdkmanager --licenses` xác nhận “All SDK package licenses accepted”. Parser PowerShell cho wrapper đạt. Chưa tạo APK/keystore và chưa có thiết bị Android kết nối để UAT push.
- Các cổng còn mở: thống nhất ngưỡng p95; xác minh chính sách backup/PITR và thực hiện diễn tập khôi phục Production theo quy trình được phê duyệt; diễn tập rollback mà không tự ý đổi alias Production; kiểm tra push trên Android thật; hoàn tất TWA/APK và xác minh assetlinks sau khi chốt application ID/chứng thư. Chưa push nhánh, mở PR hay thay đổi Production/main.

### Cập nhật lần 16 — siết xác nhận Preview và tách độ trễ gọi DB

- Tự rà soát harness phát hiện chốt bảo vệ chưa đủ: script chỉ chặn hai hostname Production đã biết nhưng chưa chứng minh URL Vercel còn lại là Preview. Sửa wrapper để gọi `vercel inspect`, yêu cầu tên project khớp project liên kết, deployment `READY`, target `preview` và host trùng URL yêu cầu; Node harness từ chối tải xa nếu không có xác nhận target Preview. Parser PowerShell đạt, probe wrapper 1 request trả JSON health HTTP 200, 0 lỗi; kiểm tra an toàn này không gửi request tới Production.
- Thêm thống kê `databaseRoundTripMs` từ trường `latencyMs` của health API để tách thời gian trong lời gọi DB khỏi tổng request client. Chạy lại Preview read-only: concurrency 25, 143 request/12,49 giây, 11,45 RPS, end-to-end p50 1.999 ms/p95 3.450 ms, thời gian lời gọi DB p50 1.502 ms/p95 2.101 ms/max 2.193 ms; concurrency 50, 337 request/12,76 giây, 26,41 RPS, end-to-end p50 1.540 ms/p95 2.818 ms, lời gọi DB p50 1.049 ms/p95 2.210 ms/max 2.601 ms. Cả hai đợt 0 lỗi, toàn bộ phản hồi là JSON 200 hợp lệ.
- `vercel inspect` xác nhận deployment thử là Preview/READY và metadata build liệt kê function ở `iad1`; request logs cho health trong hai giờ không có status >=400. Runtime logs ghi 21 dòng cảnh báo từ `pg-connection-string` về chế độ SSL tương lai (`prefer`/`require`/`verify-ca`); không có lỗi truy vấn tương ứng. Nội dung cảnh báo nói phiên bản lớn sau có thể đổi ngữ nghĩa, đề xuất đặt tường minh `sslmode=verify-full` để giữ cách xác minh hostname hiện tại. Chưa thay đổi URL kết nối hoặc cấu hình Vercel.
- Nhận định hiệu năng: độ trễ đo quanh lời gọi DB vẫn cao ở Preview, không thể quy hết cho trình duyệt/mạng. Kết hợp metadata `iad1` với Neon Preview ở Singapore là giả thuyết có thể giải thích độ trễ, nhưng chưa chứng minh nguyên nhân; hàm đo còn bao gồm đợi connection pool và thiết lập kết nối. Đề xuất ở Preview kế tiếp đánh giá function region gần Neon (`sin1`) và `sslmode=verify-full`, đo lại cùng harness sau khi các cổng cho phép triển khai Preview. Tài liệu Vercel nêu function nên chạy cùng/gần vùng cơ sở dữ liệu; không đổi region Production trong lần này.
- Phạm vi điểm: số liệu này củng cố load test Preview hợp lệ nhưng chưa tạo ngưỡng SLA. Mức code/local QA nội bộ khoảng 86% vẫn tách biệt với readiness Production; chưa đủ căn cứ chấm tổng mức sẵn sàng phát hành 85–90%. Kiểm tra chỉ đọc xác nhận Production vẫn `READY` tại commit `6a41287`; chưa push, mở PR hoặc thay đổi Production/main.

### Cập nhật lần 17 — tách RPO/RTO khỏi thời hạn khôi phục PITR

- Làm rõ cổng Production: RPO là mức mất dữ liệu tối đa chấp nhận được; RTO là thời gian tối đa để khôi phục dịch vụ. Đây là mục tiêu nghiệp vụ cần chủ sở hữu xác nhận, không thể suy ra chỉ từ thời hạn lưu lịch sử PITR. Đối chiếu độc lập các mục tiêu đó với cửa sổ PITR, giới hạn dung lượng thay đổi, lịch snapshot, gói Neon và chi phí.
- Theo tài liệu Neon được kiểm tra ngày 04/11/2026, gói Free có khôi phục tức thời trong tối đa 6 giờ hoặc 1 GB thay đổi, tùy điều kiện nào đến trước; gói Launch có cửa sổ PITR đến 7 ngày. Snapshot có thể giữ điểm khôi phục ngoài cửa sổ PITR; lịch snapshot tự động có thể yêu cầu gói trả phí. Các thông số gói thay đổi theo thời gian, cần xác minh lại trong console trước khi chốt kế hoạch. [Neon pricing update](https://neon.com/blog/new-usage-based-pricing), [Neon Free plan](https://neon.com/blog/neon-free-plan-1-gb-per-project), [Neon snapshots](https://neon.com/blog/three-ways-to-use-your-snapshots).
- PITR hỗ trợ khôi phục theo thời điểm/giao dịch trong cửa sổ lưu lịch sử; thử restore chỉ được thực hiện sang branch tách biệt đã xác nhận là Preview, tuyệt đối không ghi lên nguồn Production. Phải ghi lại kết quả, thời gian thực tế và bước xác minh dữ liệu để kiểm chứng RTO. [Neon PITR](https://neon.com/blog/announcing-point-in-time-restore).
- Chưa có quyết định RPO/RTO của chủ sở hữu nghiệp vụ và chưa có bằng chứng diễn tập khôi phục Production; vì vậy cổng backup/restore còn mở. Không thay đổi Neon Production, Vercel Production hay `main`.

### Cập nhật lần 18 — kiểm tra metadata môi trường Vercel và Android SDK

- Chỉ đọc danh sách tên/target biến môi trường Vercel: Preview có `DATABASE_URL` cùng `WEB_PUSH_VAPID_PUBLIC_KEY`, `WEB_PUSH_VAPID_PRIVATE_KEY` và `WEB_PUSH_VAPID_SUBJECT`; Production không có biến VAPID trong danh sách. Không giải mã hay ghi giá trị secrets. Việc biến tồn tại không xác nhận cặp khóa hợp lệ, đúng chủ sở hữu hoặc đã gửi/nhận Push trên Android thật.
- Assessment các lượt kiểm tra trước đã ghi nhận Neon Preview project `cencom-preview-isolated` tách khỏi Production `neon-cinnabar-bucket`, migration `0000`–`0010` và migration dry-run đạt, cùng Browser UAT trên Preview. Lượt hiện tại chỉ thấy Vercel env metadata có `DATABASE_URL` Preview và Neon Storage API có store cùng tên ở `sin1`, trạng thái `available`, `totalConnectedProjects: 0`; chưa đối chiếu giá trị kết nối hiện hành với store cụ thể. Tab Neon đang đăng nhập trước đó hiển thị Production `neon-cinnabar-bucket/main`; mở danh sách branches chuyển sang trang Log In. Không truy vấn/ghi DB, không dùng Production làm UAT. Cần xác minh ánh xạ env hiện tại trước lần UAT/migration tiếp theo; không coi số project connection bằng 0 là bằng chứng rằng Preview đang dùng Production.
- Toolchain Android thực tế có Bubblewrap 1.27.0, JDK Temurin 17.0.20.1, SDK Platform 36, Build Tools 36.1.0 và adb; `sdkmanager --list_installed`, `sdkmanager --licenses` và `bubblewrap doctor` đều đạt khi đặt `JAVA_HOME`/`ANDROID_HOME` theo cấu hình Bubblewrap trong tiến trình hiện hành. Biến môi trường Windows hiện tại trỏ sai đường dẫn, chưa sửa cấu hình toàn hệ thống. `adb devices -l` không liệt kê thiết bị; chưa tạo APK hoặc keystore.
- Production/main không thay đổi. Cổng còn mở: xác minh cô lập Neon Preview và UAT; thống nhất RPO/RTO, xác minh backup và diễn tập restore/rollback; kiểm thử VAPID trên Android thật; chốt identity/signing và xây dựng APK sau khi các cổng release đạt.

### Cập nhật lần 19 — quality gate trên working tree hiện tại

- `npm run typecheck`, `npm run lint`, `npm test` (58/58), `npm run build`, `npm audit` và `git diff --check` đều đạt trên working tree hiện tại. Build tạo đủ route API/app và hoàn tất tối ưu production. `npm audit` báo 0 vulnerabilities.
- Đây là xác minh code/local; không thay thế Preview UAT, migration trên DB riêng, kiểm thử Push trên Android thật hay xác nhận backup/rollback Production. Chưa commit/push hoặc triển khai thay đổi local.

### Cập nhật lần 20 — xác nhận trạng thái rollback Vercel

- Vercel CLI xác nhận alias `kdbt-app-dat-hang-five.vercel.app` hiện trỏ deployment Production `dpl_7h4xShHzCca2hR3yZAenNZjNh4AJ` (commit `6a41287`), trạng thái `Ready`. Ứng viên rollback đã xác định là deployment Production `dpl_22ezfdANsFE1tzpchJMwo2z4xrKf` (commit `ecd9ddf`), trạng thái `Ready`; `vercel rollback status kdbt-app-dat-hang` báo không có rollback đang chạy. Chưa thực hiện rollback.
- Đây mới là kiểm tra trạng thái và khả năng nhận diện ứng viên rollback; chưa diễn tập rollback/khôi phục database. Không thay đổi alias Production, Neon Production, hay `main`.
- Skill `deploy-to-vercel` xác nhận ưu tiên Preview và yêu cầu hỏi trước khi push. Các thay đổi local chưa được đẩy; chờ các release gate còn lại và xác nhận hành động Connect Preview đang chờ.

### Cập nhật lần 21 — xác minh cơ chế Neon Preview Branching

- Tài liệu Neon hiện hành nêu Connect Project cho phép chọn riêng môi trường nhận biến DB; khi bật `Create database branch for deployment: Preview`, Neon tạo nhánh `preview/<git-branch>` cho từng Vercel Preview deployment. Thông tin kết nối nhánh được tiêm riêng ở thời điểm deploy và ghi đè biến Preview chung; Production dùng nhánh Production độc lập. [Neon: Vercel-Managed Integration](https://neon.com/docs/guides/vercel-managed-integration).
- Form đang chuẩn bị cho đúng project `kdbt-app-dat-hang`: chọn môi trường Preview, bật tạo DB branch Preview, bỏ chọn Production, bật Sensitive và đặt prefix `DATABASE` để ứng dụng dùng `DATABASE_URL`. Chưa bấm Connect; hành động cấp credential cho Preview đang chờ xác nhận tại thời điểm thực hiện. Sau khi kết nối cần xác minh scope/branch của deployment mới, chạy migration dry-run rồi mới tiếp tục UAT/load test.

### Cập nhật lần 22 — kiểm tra nhánh và CI trên GitHub

- Working tree đang ở commit local `ca9dce2`; `git ls-remote` không trả ref cho `feature/notifications-scale-android`. GitHub API liệt kê các nhánh `codex/customer-management`, `develop`, `main`; không có nhánh feature này. GitHub API cũng không tìm thấy commit `ca9dce24fe79d56e73fc1e21abc5d7881ca91c23` và combined status của commit không có checks. CLI `gh` chưa cài; xác nhận nhánh/commit thực hiện bằng GitHub connector chỉ đọc.
- Quality gates local vừa đạt nhưng chưa có CI GitHub cho trạng thái này. Theo chỉ thị phát hành, chưa push/open PR khi các cổng môi trường, backup/rollback và Android còn mở.

### Cập nhật lần 23 — kết nối Neon Preview và rà soát lỗi tắt Push

- Theo xác nhận của người dùng, kết nối store Neon `cencom-preview-isolated` vào project Vercel `kdbt-app-dat-hang`, chỉ môi trường Preview; bật tạo DB branch cho Preview deployments, prefix `DATABASE`, bật Sensitive. Dashboard xác nhận project xuất hiện trong Connected Projects của store. Production không được chọn.
- Vercel báo `DATABASE_URL` Preview hiện hữu xung đột; sau xác nhận riêng về thao tác không thể Undo, chỉ biến `DATABASE_URL` trong môi trường Preview được xóa để tích hợp tạo biến thay thế. Danh sách sau đó xác nhận các biến prefix `DATABASE` (gồm `DATABASE_URL`) và link Neon chỉ xuất hiện ở Preview; các biến Neon/`DATABASE_URL` Production vẫn hiện riêng và không bị sửa. Dashboard cho biết cần deployment mới để thay đổi có hiệu lực.
- Chưa redeploy vì checklist yêu cầu các cổng bắt buộc đạt trước deployment. Do đó connection metadata đã được lưu, nhưng URL được tiêm vào deployment mới, Neon branch `preview/<git-branch>`, và scope DB thực tế của deployment mới chưa được xác minh. Cần kiểm tra nhánh Preview sinh ra trước khi chạy migration dry-run; không dùng Neon Production/main.
- Tự rà soát thấy nhánh tắt Web Push bỏ qua lỗi HTTP khi xóa subscription và không khóa thao tác lặp; đã sửa để chỉ unsubscribe cục bộ sau khi server xác nhận, hiển thị lỗi nếu API thất bại và luôn mở khóa nút sau xử lý. `npm run typecheck`, `npm run lint`, `npm test` (58/58), `npm run build`, `npm audit` (0 lỗ hổng) và `git diff --check` đều đạt sau sửa.
- Chưa push/PR hoặc deploy, chưa thay đổi Production/main. Các cổng Preview migration/UAT/load test sau binding, Production backup/restore và rollback drill, VAPID/Push Android thật, APK/assetlinks/TWA và CI GitHub vẫn còn mở.

### Cập nhật lần 24 — xác định đích migration và đo lại tải Preview

- Đối chiếu Neon Console sau khi nối integration: project `cencom-preview-isolated` (ID `winter-river-11456796`, Singapore, 32.89 MB) hiện chỉ có branch `main`; chưa có branch gắn với deployment Vercel. `vercel env run --environment preview --git-branch feature/notifications-scale-android` đã nạp biến Preview từ store này, nhưng chưa chứng minh được đó là branch Preview deployment.
- Dry-run trước đó cho biết migration `0010_notification_preferences_and_push.sql` còn thiếu; sau đó migration được áp thành công vào `main` của project Neon Preview cô lập (0000–0010). Đây **không phải** Neon Production `main`, và không có UAT/booking write nào trong lượt này. Tuy vậy, thao tác đã ghi lên branch mặc định của project Preview nên không đáp ứng yêu cầu dùng branch deployment riêng cho UAT. Giữ cổng browser UAT đóng cho tới khi branch Preview riêng được xác lập. Production/main và dữ liệu Production không bị tác động.
- Load test read-only trên deployment `dpl_6LUB6QziC5iQqut8cGiecVHMKNyo` (`READY`, `preview`) qua wrapper: concurrency 25, 10 giây, 155 request, 0 lỗi; p50/p95 tổng 1,495/3,743 ms, p50/p95 DB 991/1,996 ms. Ở concurrency 1, 12 request, 0 lỗi; p50/p95 tổng 730/2,264 ms, DB 223/1,572 ms. Chưa có SLA; latency p95 cao và cần profiling/đối chiếu Vercel function, DB cold start và round-trip trước khi tuyên bố đạt hiệu năng.
- Kết nối integration đã thêm các biến `DATABASE_*` chỉ cho Preview; Production variables vẫn riêng. Redeploy để binding có hiệu lực và sinh branch deployment chưa thực hiện theo trình tự release checklist.
- Chưa push/PR/deploy. Cổng còn mở: nhánh DB Preview riêng và UAT/load test nhánh đó, CI cho source đầy đủ, RPO/restore/rollback Production, Push trên Android thật, applicationId/signing, Digital Asset Links và APK.

### Cập nhật lần 25 — tách rõ biến Preview cấp project và biến theo deployment

- Tài liệu Neon hiện hành xác nhận nhánh Preview chỉ được tạo khi có Vercel Preview deployment; credential của nhánh được tiêm tại deployment và ghi đè biến Preview cấp project. Vì thế `vercel env run --environment preview --git-branch ...` không chứng minh rằng lệnh đang trỏ vào branch gắn với deployment. [Neon Vercel-Managed Integration](https://neon.com/docs/guides/vercel-managed-integration).
- Neon Console hiện cung cấp tùy chọn Beta `Branch schema only` để sao chép schema mà không có dữ liệu. Đây là hướng phù hợp nếu cần DB sạch, nhưng nhánh này chưa được tạo hoặc gắn vào Vercel. Đã hỏi xác nhận thao tác tạo `uat/notifications-scale-android` với auto-delete 1 ngày; chờ phản hồi trước nút Create.
- Cập nhật `docs/release-process.md`: buộc đối chiếu branch deployment chính xác trước migration/UAT, cảnh báo giới hạn của `vercel env run`, cấm UAT trên `main`/dữ liệu Production, và yêu cầu schema-only branch/DB sạch cùng synthetic seed nếu dữ liệu parent chưa xác minh.
- Kiểm tra offline tương thích cặp VAPID Preview được thử nhưng trình thực thi chặn tiến trình cần đọc biến bí mật. Không giá trị khóa nào được in; cặp key/subject vẫn chưa được xác minh bằng phép tính cục bộ hoặc Push thật.

### Cập nhật lần 26 — xác minh lại môi trường, Production recovery và Android toolchain

- Điểm 85% trong scorecard ban đầu là mức hoàn thiện sản phẩm/mã theo đánh giá nội bộ tại thời điểm đó, không phải điểm sẵn sàng deploy hiện tại. Chưa có rubric định lượng thống nhất để gộp các cổng release thành một tỷ lệ; vì vậy không tuyên bố đạt mục tiêu 85–90% deploy-ready khi Preview UAT, restore/rollback và Android push còn chưa qua.
- Vercel UI xác nhận các biến Neon `DATABASE_*` (gồm `DATABASE_URL`) gắn store `cencom-preview-isolated` chỉ ở Preview; không đọc/hiển thị giá trị biến. Neon project Preview vẫn chỉ có branch `main`; biểu mẫu tạo nhánh schema-only đã đóng mà chưa gửi. Preview deployment hiện có được tạo trước binding nên chưa chứng minh kết nối mới có hiệu lực.
- Neon Production project `neon-cinnabar-bucket` đang ở Free plan, branch `main`, History window/PITR 6 giờ; không thấy snapshot backup độc lập hoặc lịch backup trong phần đã kiểm tra. Chưa có restore drill, RPO/RTO nghiệp vụ chưa thống nhất. Vercel Production vẫn là deployment Ready `dpl_7h4xShHzCca2hR3yZAenNZjNh4AJ` trên commit `6a41287`; deployment trước đó `ecd9ddf` cũng Ready, nhưng menu deployment hiện tại vô hiệu hóa Instant Rollback. Cổng backup/rollback chưa đạt.
- `bubblewrap doctor` xác nhận JDK và Android SDK path hợp lệ; SDK nằm ở `E:\dev\cencom-android-toolchain\android-sdk`. Lệnh `adb` không có trên PATH, nhưng `platform-tools\adb.exe` trong SDK chạy được và báo không có thiết bị kết nối. Chưa có app ID, keystore hoặc APK; DAL và kiểm tra push trên thiết bị thật còn mở.
- Vercel MCP đọc project/deployment bị từ chối do scope chưa được cấp cho connector; đã tiếp tục xác minh bằng UI đăng nhập sẵn, không đổi quyền hoặc tìm cách vượt chặn. Không push/PR/deploy và không sửa Neon Production/main.

### Cập nhật lần 27 — chạy lại quality gates trên working tree hiện tại

- `npm test`: 58/58 đạt; `npm run lint`, `npm run typecheck`, `npm run build` (Next.js 16.4.3) và `npm audit --omit=dev --audit-level=moderate` (0 lỗ hổng) đều đạt. Build đọc cấu hình `.env.local` nhưng không chạy migration.
- Đây xác nhận chất lượng code/build hiện tại, không chứng minh Vercel Preview branch isolation, browser UAT, backup/restore, rollback, VAPID trên Android thật hay khả năng cập nhật APK. Điểm deploy-ready tổng thể vẫn chưa được chấm vì các cổng trên chưa có rubric đạt/không đạt hoàn chỉnh; không nâng điểm 85% ban đầu thành tuyên bố sẵn sàng phát hành.
- Không push/PR/deploy. Các thay đổi source/docs còn trong working tree; `git diff --check` cần được chạy lại sau lần ghi này.

### Cập nhật lần 28 — nhánh UAT schema-only được tạo, chưa nối với Preview

- Theo xác nhận của người dùng, đã tạo branch `uat/notifications-scale-android` trong Neon project `cencom-preview-isolated` (`winter-river-11456796`), branch ID `br-small-voice-b30e2cqk`, từ branch `main` của project Preview riêng. Chọn schema-only, không sao chép dữ liệu; tự hết hạn sau 1 ngày (05/11/2026 khoảng 10:29 giờ Bangkok). Đây không phải Neon Production `main`.
- Việc tạo branch chưa tự chứng minh Preview deployment dùng branch này. Biểu mẫu Vercel đang mở cho `DATABASE_URL` ở Preview theo Git branch `feature/notifications-scale-android`, dạng Secret; chưa điền hoặc lưu giá trị. Không chạy migration dry-run/apply, UAT hay load test trên branch này cho tới khi kết nối và danh tính DB của deployment được xác minh.
- Đăng nhập Neon bằng Google trong IAB đã thành công. Branch list xác nhận branch UAT là Schema-only, không có deployment Vercel liên kết và endpoint đang idle; metadata branch xác nhận hết hạn 2026-11-05 10:29:49. Vercel form vẫn chọn đúng `DATABASE_URL`, type Secret, Preview branch `feature/notifications-scale-android`, Production không chọn và chưa lưu. Sao chép connection snippet từ Neon bị trình duyệt chặn clipboard; không nhập/lưu biến và không chạy migration. Vercel MCP trả 403 thiếu quyền scope team. Consent link một lần đã tạo nhưng chưa thấy xác nhận duyệt và đã hết hạn; lần kiểm tra lại vẫn 403. Tạo link mới khi chủ tài khoản sẵn sàng duyệt qua trang Vercel chính thức. Không dùng CLI token hoặc cách khác để vượt chặn.
- Kiểm tra Android hiện tại: Bubblewrap 1.27.0 `doctor` đạt. Shell mặc định vẫn trỏ `JAVA_HOME` cũ; cần đặt `JAVA_HOME`, `ANDROID_HOME` và `PATH` theo thư mục toolchain chỉ trong tiến trình chạy Android SDK. `adb` chưa có thiết bị kết nối. Chưa chốt applicationId/chủ sở hữu chữ ký, keystore, APK hoặc thử DAL/push trên thiết bị.

### Cập nhật lần 29 — dừng sử dụng credential UAT sau khi lộ trong ảnh chụp

- Trong lúc thao tác giao diện Neon, ảnh chụp công cụ đã hiển thị không che mật khẩu của role DB trên branch schema-only UAT. Không ghi giá trị vào file/repo và không đưa vào `DATABASE_URL` Preview.
- Đã ẩn lại mật khẩu trong giao diện. Cần chủ tài khoản tự đổi credential của role DB phạm vi branch UAT qua giao diện Neon, xác nhận phạm vi tác động, rồi dùng connection string mới để cấu hình Vercel Preview. Không gửi credential mới vào chat.
- `DATABASE_URL` Preview chưa được lưu; chưa chạy dry-run/migration/UAT/load test. Production và Neon Production không bị tác động.

### Cập nhật lần 30 — migration trên database UAT sạch

- Người dùng xác nhận đã đổi credential và cung cấp file local chứa role và mật khẩu; không ghi giá trị bí mật vào repo, log hay chat. Kết nối thành công tới endpoint của branch `uat/notifications-scale-android` trong project `cencom-preview-isolated`.
- Nhánh schema-only có schema nhưng bảng `_app_migrations` rỗng; không áp lại lên database `neondb` sẵn có. Đã tạo database trống `cencom_uat` trong cùng nhánh UAT, chạy dry-run liệt kê 0000–0010, sau đó áp thành công cả 11 migration. Chưa seed hay chạy browser UAT/load test.
- Thử lưu `DATABASE_URL` dạng Secret cho Preview theo Git branch `feature/notifications-scale-android`; Vercel từ chối `branch_not_found` vì nhánh chưa tồn tại trong Git repository đã kết nối. Biến theo branch chưa được tạo; không push, PR hoặc deploy. Neon integration có thể tiêm cấu hình theo deployment nên vẫn phải xác minh database và branch thực tế của deployment trước mọi UAT.
- Branch UAT có thời hạn tự xóa 05/11/2026 khoảng 10:29 giờ Bangkok. Các cổng backup/restore và rollback Production, Push Android thật, CI và APK vẫn mở.

### Cập nhật lần 31 — chặn sai đích database Preview

- Build Preview và ứng dụng khi tạo pool DB yêu cầu `DATABASE_URL` khớp host và database được cấu hình riêng bằng `PREVIEW_DATABASE_HOST` và `PREVIEW_DATABASE_NAME`. Thiếu hoặc không khớp thì dừng; kiểm tra này không tự chứng minh metadata branch hay cấu hình deployment thực tế.
- `npm test` đạt 59/59; lint, typecheck, build và thử build với host sai đều đạt. Phép thử host sai xác nhận build dừng trước migration và không in credential.
- Chưa cấu hình các biến mới trên Vercel hoặc tạo deployment mới. Preview UAT, kiểm tra Production recovery và thử Push trên Android thật vẫn chưa có bằng chứng đạt.

### Cập nhật lần 32 — Preview cô lập và đo tải đọc

- Tạo deployment Preview `dpl_AXLKazcsy4afN5nkPPC9JHVvETvk` trên project ứng dụng hiện có; build dừng trước migration vì integration cấp URL khác đích UAT. Chốt kiểm tra hoạt động đúng; không dùng deployment lỗi này cho UAT.
- Tạo project Vercel riêng `cencom-uat-isolated`, không nối Neon integration của project ứng dụng. Dù lệnh yêu cầu Preview, deployment đầu tiên `dpl_8Exqzxo4bLUCCCErLPMREyiutBAq` bị Vercel xếp Production của project UAT mới, dùng database UAT và không thay đổi project Production ứng dụng. Deployment tiếp theo `dpl_Azi4KjnomenFGpxKzNiDWCHMiMzJ` là Preview, READY. Cả hai dùng credential và dữ liệu UAT; key VAPID và secret xác thực được tạo riêng cho từng deployment thử.
- Build Preview ghi nhận đúng endpoint và database `cencom_uat`; 11 migration đã áp nên không có migration mới. Health runtime trả `database: up`. Chưa có browser UAT nghiệp vụ hoặc kiểm thử Push trên Android thật.
- `vercel curl` tự tạo automation bypass trên project UAT khi kiểm tra health. Đã thu hồi và xác nhận còn 0 automation bypass; không công bố secret hoặc link bypass. Không dùng cách này cho phép đo tải.
- Load test đọc `/api/health` bằng token Trusted Sources ngắn hạn trên deployment Preview: lần chạy lại concurrency 10, 90 request, 0 lỗi, p50/p95 tổng 1.081/2.227 ms, p50/p95 DB 601/1.605 ms; wrapper thoát mã 0. Lần trước đo 88 request, 0 lỗi nhưng trình bao thu thập bị lỗi mã hóa sau khi in kết quả. Không có ngưỡng SLA được xác định; phép đo chỉ bao phủ endpoint đọc health.
- Project Production của ứng dụng và Neon Production không bị thay đổi. Còn xác minh luồng nghiệp vụ Preview, backup/restore và rollback Production, Android Push và các cổng phát hành khác; chưa push/PR.

### Cập nhật lần 33 — snapshot và khôi phục sang nhánh riêng

- Neon Production `neon-cinnabar-bucket` xác nhận History 6 giờ, chưa có lịch snapshot. Đã tạo một snapshot thủ công lúc 04/11/2026 17:31 GMT+7; giao diện báo không hết hạn và đã chạm giới hạn snapshot thủ công của gói hiện tại. Snapshot này cùng dịch vụ Neon, không phải bản sao lưu độc lập ngoài nhà cung cấp.
- Chọn multi-step restore từ snapshot, Neon báo thành công và tạo nhánh riêng `br-sweet-moon-aoqjdwrf`; nhánh `main` giữ nguyên và vẫn là default. Danh sách nhánh khôi phục hiển thị hai database `neondb` và `cencom_preview`. Truy vấn chỉ đọc trên `neondb` khôi phục xác nhận truy cập được, có bảng orders và customers, bảng migration có 5 bản ghi; truy vấn đếm trả 1 order, 1 customer và 4 users. Chưa đối chiếu với nguồn tại thời điểm snapshot hoặc kiểm tra đầy đủ tính toàn vẹn, chưa chuyển kết nối; dữ liệu Production không được dùng cho UAT.
- Nhánh khôi phục chứa bản sao dữ liệu Production, hiện không có thời hạn tự xóa và chưa kết nối với Vercel. Cần quản lý quyền truy cập, lưu giữ hoặc dọn nhánh theo chính sách sau khi kiểm tra xong. RPO/RTO nghiệp vụ, khôi phục dữ liệu có xác minh và quy trình rollback Vercel vẫn cần được xác nhận trước release.

### Cập nhật lần 34 — sửa danh mục cát lệch giữa migration và ứng dụng

- Browser UAT từ chối booking tổng hợp vì database có `Cát Lọc` trong khi ứng dụng dùng `Cát Lộc`. Blame xác nhận `Cát Lộc` có từ commit 62b4422 ngày 02/11; migration 0009 được thêm sau đó đã viết sai một ký tự. Các giá trị còn lại không cần sửa.
- Thêm migration 0011 chỉ thay chính xác `Cát Lọc` thành `Cát Lộc` trong catalog cài sẵn, giữ thứ tự và các tùy chọn khác. Chưa áp migration này lên Production.

### Cập nhật lần 35 — kiểm chứng cục bộ và UAT vai trò

- Trên Neon UAT cô lập, chạy dry-run rồi áp migration 0011; không kết nối hoặc ghi lên Neon Production. Trang UAT chạy code của deployment Preview cô lập; sau khi gửi booking mẫu, dữ liệu xuất hiện khi lọc đúng ngày. Sales tạo được booking với catalog `Cát Lộc`; tài khoản Kế hoạch nhìn thấy booking và chuyển một booking sang `Đã xác nhận`. Badge Tin báo ở tài khoản Kế hoạch hiển thị 2 thông báo tương ứng với hai booking tổng hợp.
- Vercel Request Logs xác nhận hai lần POST `/api/orders` trả HTTP 201; bảng Kế hoạch thấy hai booking tổng hợp `BOOK-7431`/`BOOK-7432`, một booking đã xác nhận qua PATCH HTTP 200 và một còn chờ duyệt. Giao diện accessibility vẫn báo `Đang lưu...` ngay sau submit, cần xác minh lại trên phiên trình duyệt ổn định; không có bằng chứng request bị lỗi máy chủ. Badge Tin báo của Kế hoạch hiện 2. Chưa xác nhận người nhận thông báo phía Sales.
- Chạy lại sau migration: `npm test` đạt 59/59; `npm run typecheck`, `npm run lint`, `npm run build` và `npm audit --omit=dev` đều thoát mã 0; audit không phát hiện lỗ hổng production dependency.
- Kiểm tra lại Android: `bubblewrap doctor` xác nhận JDK path và Android SDK path hợp lệ; `adb devices -l` không thấy thiết bị kết nối. Chưa tạo APK vì chưa chốt applicationId/chủ thể ký và chưa có thiết bị Android để kiểm thử TWA/Push.
- API MCP đọc runtime logs Vercel bị từ chối 403; Request Logs qua dashboard vẫn đọc được mã HTTP. Load test trước đó chỉ đo GET `/api/health`, không đo POST booking hoặc tải nghiệp vụ.
- Production app, Git `main` và Neon Production `main` chưa thay đổi. Migration 0011 chưa áp Production; chưa push/PR/deploy bản release. Cổng Production còn mở: làm rõ trạng thái gửi booking và xác nhận thông báo đến Sales; backup ngoài Neon hoặc lịch backup/retention phù hợp, RPO/RTO và quy trình rollback; Push VAPID trên thiết bị Android thật; hoàn thiện APK/TWA. Chưa đủ điều kiện tuyên bố sẵn sàng phát hành Production.
