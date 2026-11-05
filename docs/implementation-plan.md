# Lộ trình đưa CENCOM vào vận hành

## Đã có trong ứng dụng

- Đăng nhập nội bộ và phân quyền Admin, Kế hoạch, Kinh doanh, Kế toán.
- NVKD tạo booking trên điện thoại; mã booking được PostgreSQL cấp tự động.
- Kế hoạch duyệt booking, chỉnh giờ cấp, giao phương tiện và theo dõi lịch sử trên bảng desktop.
- Xuất bảng kế hoạch `.xlsx` theo mẫu nghiệp vụ; Kế toán/Admin quản lý sổ công nợ và xuất sổ. NVKD xem công nợ khách hàng được giao, ghi nhận tiền đã thu và xuất dữ liệu trong phạm vi phụ trách.
- PWA có thể cài trên điện thoại/tablet; các trang và API mang dữ liệu không được lưu vào cache offline.
- Admin quản lý tài khoản/hồ sơ nhân viên, thương hiệu/giao diện và danh mục mác, cát, đá, bơm, phương tiện phục vụ, dung tích xe, hạng mục; lưới kế hoạch lấy lựa chọn trực tiếp từ cùng danh mục cài đặt.
- Báo cáo sản lượng phân biệt khách hàng theo nhân viên kinh doanh phụ trách.
- Admin tải mẫu `.xlsx` tiếng Việt, xem trước tối đa 200 khách/lần, ghép chủ sở hữu theo email/mã NVKD đang hoạt động, bỏ qua khách trùng và nhập hợp lệ theo một yêu cầu có kiểm tra quyền. Admin/Kế hoạch xuất danh mục bằng workbook `.xlsx` đã định dạng; PostgreSQL/Neon lưu dữ liệu vận hành.

## Bằng chứng kỹ thuật gần nhất

- `npm test`: 58/58 đạt trên source hiện tại, gồm luật booking, phân quyền, lịch kế hoạch, PWA, nhập/xuất workbook XLSX, tính công nợ, thông báo và chuẩn hóa catalog cũ. Test workbook mở lại file và xác nhận các cột người liên hệ/điểm đổ, giờ cấp, khối lượng, vật liệu, phương tiện, ghi chú, tổng công thức và vùng lọc.
- `npm run lint`: đạt.
- `npm run typecheck`: đạt.
- `npm run build`: đạt với Next.js 16.4.3.
- Production health check gần nhất trước phát hành trả `status: ok`, `database: up`. Ngày 03/11/2026 đã áp các migration Production còn thiếu `0005`–`0009` sau dry-run xác nhận đúng Neon Production. Build, lint, typecheck và 58 unit tests đạt trên source phát hành. Đã tạo ba tài khoản UAT production từ đợt trước để kiểm tra quyền theo vai trò; booking smoke test `BOOK-7431` đang Đã hủy, không phải dữ liệu vận hành thật.
- UAT local đã chạy luồng booking → xếp lịch → ghi công nợ → xuất XLSX và kiểm tra chặn quyền chéo trên PostgreSQL local `cencom_accounting_test` ở cổng 55432, tách khỏi Neon Production. Neon Preview cô lập `cencom-preview-isolated` đã có migration `0000`–`0010`; UAT browser vai trò NVKD → Kế hoạch → Admin đạt trên Preview. Vercel hiện liệt kê Preview hostname `kdbt-app-dat-hang-d3p3i4sxy-vohanh19902026-droid.vercel.app`, deployment `dpl_6LUB6QziC5iQqut8cGiecVHMKNyo`, commit `ca9dce2`, trạng thái `READY`; UX xin quyền Push đã được kiểm tra trên deployment này.
- Browser phiên đăng nhập bình thường xác nhận 20 GET `/api/health` qua 10 tab/2 chu kỳ, 20/20 JSON health khỏe. Harness sau khi lấy OIDC Development token mới đã chạy Preview read-only: concurrency 25 đạt 157 request/12,77 giây, p95 3.395 ms; concurrency 50 đạt 302 request/14,98 giây, p95 4.982 ms; 0 lỗi và body JSON hợp lệ. p95 cần được đối chiếu với mục tiêu sản phẩm vì chưa có SLA được thống nhất. Lần chạy token cũ trả HTML Login đã bị loại. Không dùng share link, `vercel curl`, cookie hoặc bypass. Push gửi/nhận chưa được xác minh; cần quyền Notification bình thường và thiết bị Android thật.

## Việc cần làm để bắt đầu vận hành thật

1. Admin đổi mật khẩu khởi tạo; gửi tài khoản và mật khẩu tạm của nhân viên qua kênh riêng, yêu cầu từng người tự đổi mật khẩu.
2. Admin tạo tài khoản cho nhân viên theo danh sách thật, gán đúng vai trò, mã nhân viên, số điện thoại và bộ phận. Sau khi hoàn tất UAT, khóa ba tài khoản `uat.*`.
3. Admin chỉnh danh mục vật liệu/mác/bơm/dung tích xe theo quy cách CENCOM và nhập danh sách gợi ý phương tiện phục vụ để kế hoạch chọn từ lưới.
4. Tải mẫu XLSX, điền danh sách khách hàng thật và giao khách cho NVKD phụ trách trước khi ghi nhận công nợ.
5. NVKD và kế hoạch diễn tập một đơn thật quy mô nhỏ trên điện thoại và máy tính; xác nhận lại file XLSX với mẫu Excel gốc của công ty.
6. Thống nhất RPO/retention; xác minh PITR/snapshot và diễn tập restore an toàn trên branch mới trước khi nhập dữ liệu vận hành diện rộng. Chưa thay đổi Production khi chưa qua các cổng release.

## Giới hạn còn lại

- Web Push và hộp thư thông báo trong app đã triển khai; chưa kiểm chứng nhận Push end-to-end trên thiết bị. Email, xử lý booking ngoại tuyến, hóa đơn/thuế và phân bổ một khoản thu cho nhiều hóa đơn chưa triển khai.
- Danh sách phương tiện phục vụ là các lựa chọn gợi ý dạng tên; chưa quản lý hồ sơ đội xe (biển số, tải trọng, trạng thái bảo dưỡng hoặc xung đột lịch) cho tới khi có dữ liệu phương tiện thật.
- XLSX hiện dựng theo ảnh tham khảo; cần workbook gốc để xác nhận chính xác độ rộng, màu, nhóm tiêu đề và bố cục in.
- Chưa có thông tin nhân sự và danh sách khách hàng thật để tạo dữ liệu vận hành production. Không tạo dữ liệu giả trên Neon.
