# Đánh giá phát hành 03/11/2026

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

### Cổng còn mở trước khi deploy

1. Bật lại quyền truy cập `https://vercel.com` trong thiết lập Browser của Codex. Lượt này, yêu cầu mở trang Vercel bị chính sách quyền đã lưu từ chối; tôi không dùng đường khác để né chặn.
2. Không trỏ Preview vào Neon `main`. Xác nhận dữ liệu trong `develop-preview` đã được mask hoặc tạo một database Preview không mang dữ liệu khách hàng; sau đó gắn `DATABASE_URL` của nhánh riêng vào Vercel Preview.
3. Chạy dry-run migration trên đúng Preview, áp migration additive `0010` lên Preview, chạy browser UAT và load test Preview.
4. Xác minh PITR/backup Production và cách rollback trước khi áp migration `0010` lên Production.
5. Tạo/cấu hình VAPID keys riêng cho Preview và Production, kiểm tra push trên Chrome Android đã cài PWA; không đóng gói APK trừ khi nghiệm thu trên thiết bị cho thấy PWA không đáp ứng.
6. Sau khi mọi gate đạt, đẩy PR/nhánh đã kiểm tra, xác minh GitHub Actions và Vercel Preview, rồi mới merge/push `main` và chạy smoke test Production.

Không có dữ liệu thử, secret, connection string hoặc token nào được thêm vào Git. `main`, alias Production và dữ liệu Neon Production không bị thay đổi trong lượt này.
