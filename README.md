# CENCOM · Đặt hàng và điều phối bê tông

Ứng dụng web responsive cho kinh doanh đặt bê tông trên điện thoại/PWA và kế hoạch điều phối trên máy tính. Nền khung dùng Next.js + Better Auth + Drizzle ORM + PostgreSQL (Neon). Phần riêng của CENCOM là quy trình booking bê tông, phân quyền nghiệp vụ, bảng kế hoạch và tệp XLSX theo mẫu tham khảo.

## Chạy local

Yêu cầu Node.js 20.9 trở lên và PostgreSQL/Neon.

1. `npm install`
2. Sao chép `.env.example` thành `.env.local`, điền `DATABASE_URL`, `BETTER_AUTH_SECRET` (ít nhất 32 ký tự) và `BETTER_AUTH_URL`.
3. Chạy `drizzle/0000_initial.sql` rồi `drizzle/0001_planning_basis_index.sql` trong Neon SQL Editor (hoặc dùng `npm run db:push` trên database trống).
4. `npm run dev`, mở `http://localhost:3000`.
5. Chạy `npm run auth:create-admin` trên máy đã kết nối database để tạo Admin đầu tiên bằng lời nhắc nhập trong terminal. Mật khẩu được nhập ẩn.
6. Đăng nhập Admin và tạo tài khoản NV kế hoạch/NV kinh doanh tại `/admin/users`. Để nạp 12 booking mẫu, dùng `npm run db:seed -- --allow-demo-data` chỉ với database dành riêng cho thử nghiệm; script từ chối chạy nếu thiếu cờ xác nhận và tự bỏ qua khi database đã có booking.

Không chạy seed trên database có dữ liệu vận hành. Không đưa `.env.local` hoặc thông tin Neon vào Git/Vercel source.

## Triển khai thử trên Vercel + Neon

- Project đã được kết nối Neon và deploy trên Vercel. Ứng dụng: <https://kdbt-app-dat-hang-eu1a50fak-vohanh19902026-droid.vercel.app/login>.
- Vercel cần `DATABASE_URL`, `BETTER_AUTH_SECRET` và `BETTER_AUTH_URL`. Build command `npm run build`, framework Next.js. `BETTER_AUTH_SECRET` phải là secret ngẫu nhiên dài ít nhất 32 ký tự; không đưa secret vào Git, tài liệu, chat hoặc ảnh chụp.
- Các migration được quản lý qua `npm run db:migrate`; script áp theo thứ tự, ghi nhận migration đã chạy và có chế độ xem trước `npx tsx scripts/apply-migrations.ts --dry`.
- Migration `0002_receivable_ledger.sql` bổ sung sổ công nợ; trước khi deploy phiên bản có phân hệ này, chạy `npm run db:migrate` trên Neon.
- Admin đầu tiên đã được tạo trên database theo biên bản triển khai ngày 2026-11-02. Không lưu mật khẩu tài khoản trong repo. Admin đăng nhập và tạo tài khoản nội bộ ở `/admin/users`; người dùng có thể tự đổi mật khẩu trong menu tài khoản.
- PWA cài từ trình duyệt cần HTTPS; service worker chỉ lưu màn offline và icon, không cache trang/API chứa dữ liệu riêng.

## Quy trình MVP

- Kinh doanh đăng nhập trên mobile, tạo booking gồm khách hàng, địa chỉ, liên hệ, khối lượng, mác, cát/đá, thời điểm yêu cầu, xe bơm, xe chở/chuyến và ghi chú. Mã `BOOK-####` do PostgreSQL sequence sinh nguyên tử.
- Kế hoạch/Admin xem booking theo ngày trên lưới Tabulator, sửa trực tiếp ngày cấp, giờ, khối lượng, vật liệu, xe bơm/xe phục vụ, ghi chú và trạng thái. Mỗi cập nhật được ghi `order_events`; `version` do trình duyệt gửi lên ngăn ghi đè khi hai người sửa cùng lúc.
- Kế hoạch/Admin xuất workbook `.xlsx` thật với tiêu đề gộp, định dạng, bộ lọc, cố định hàng tiêu đề, tổng khối lượng và thiết lập in ngang A3. Bảng kế hoạch và tệp xuất lọc theo ngày cấp hàng (`planned_start_at`), đơn chưa xếp lịch rơi về ngày yêu cầu.
- Admin tạo/khóa tài khoản và phân quyền. Public signup bị tắt. Kế toán/Admin ghi tăng khoản phải thu và ghi nhận tiền thu bằng giao dịch VND append-only; có thể gắn booking, số hóa đơn/phiếu thu và diễn giải. Hệ thống không tự tính giá từ m³, không lập hóa đơn và không thay thế phần mềm kế toán.

## Vai trò

- `ADMIN`: quản lý tài khoản, booking, bảng kế hoạch và export.
- `PLANNER`: xem và xử lý mọi booking, sửa/xếp lịch, export.
- `SALES`: tạo booking và chỉ xem booking của mình.
- `ACCOUNTANT`: xem/ghi sổ công nợ và báo cáo; không được sửa booking hoặc quản lý người dùng.

## Nền tham khảo và phần riêng

Xem [`docs/base-app-evaluation.md`](docs/base-app-evaluation.md) để biết nền nguồn mở được chọn, những gì được tái sử dụng và phần viết riêng. Mô hình dữ liệu/quyết định kiến trúc nằm ở [`docs/architecture.md`](docs/architecture.md) và [`docs/data-model.md`](docs/data-model.md). License nền Better Auth Starter được giữ tại [`LICENSE-ZEXA`](LICENSE-ZEXA); thông báo thư viện tại [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

## Trạng thái vận hành hiện tại

- Bản production theo nhật ký triển khai đang ở commit `ac0d07b`. P1/P2 hiện tiếp tục trong workspace local; thay đổi mới chưa được đưa lên production.
- Lần kiểm tra local ngày 2026-11-02: `npm run typecheck`, `npm run lint`, `npm test` (31/31), `npm run build` và `npm audit` (0 lỗ hổng) đều đạt.
- Demo PostgreSQL thử nghiệm đã xác nhận tạo booking tự tăng mã, xếp lịch/gán xe, ghi audit và xuất XLSX có booking/phương tiện; bản ghi kiểm tra phát sinh đã được dọn. 12 booking mẫu còn trong cụm PostgreSQL thử nghiệm đã dừng, không thuộc production.
- Nhật ký triển khai ngày 2026-11-02 ghi nhận migration đã áp lên Neon, Admin đã khởi tạo, deployment production Ready, `/api/health` trả 200 với database `up`, 16/16 smoke kiểm tra HTTP production đạt và dữ liệu smoke đã được dọn.
- Ứng dụng có security headers, CSP production, chặn Origin lạ trên API ghi dữ liệu và giới hạn truy vấn theo ngày. `/orders` đã được sửa lỗi SSR của Tabulator; có health check, error/loading boundary, lịch sử booking, báo cáo khoảng ngày và đổi mật khẩu tự phục vụ.
- P1/P2 đã được triển khai trong workspace: giới hạn đăng nhập 5 lần/phút (bộ đếm in-memory theo instance Vercel), structured error logs không ghi message/secret, và phân hệ sổ công nợ. Cần chạy migration `0002_receivable_ledger.sql` và deploy phiên bản mới thì màn công nợ mới hoạt động trên production.
- Trước khi nhập dữ liệu vận hành: Admin cần đăng nhập, đặt mật khẩu riêng, tạo tài khoản NV kế hoạch/NVKD; chủ hệ thống cần xác nhận backup/restore Neon và diễn tập với nhân viên.
- Mẫu XLSX được dựng theo ảnh tham khảo; độ rộng/nhóm màu có thể điều chỉnh theo workbook gốc nếu có file Excel chuẩn.
