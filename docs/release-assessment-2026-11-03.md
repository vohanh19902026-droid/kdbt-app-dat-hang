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
