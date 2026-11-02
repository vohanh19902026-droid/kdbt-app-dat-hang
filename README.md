# CENCOM · Đặt hàng và điều phối bê tông

Ứng dụng web responsive cho kinh doanh đặt bê tông trên điện thoại/PWA và kế hoạch điều phối trên máy tính. Nền khung dùng Next.js + Better Auth + Drizzle ORM + PostgreSQL (Neon). Phần riêng của CENCOM là quy trình booking bê tông, phân quyền nghiệp vụ, bảng kế hoạch và tệp XLSX theo mẫu tham khảo.

## Chạy local

Yêu cầu Node.js 20.9 trở lên và PostgreSQL/Neon.

1. `npm install`
2. Sao chép `.env.example` thành `.env.local`, điền `DATABASE_URL`, `BETTER_AUTH_SECRET` (ít nhất 32 ký tự) và `BETTER_AUTH_URL`.
3. Chạy `npm run db:migrate` để áp các migration còn thiếu theo thứ tự. Với database trống, lệnh này tạo toàn bộ schema hiện hành; không chạy `db:seed` trên database vận hành.
4. `npm run dev`, mở `http://localhost:3000`.
5. Chạy `npm run auth:create-admin` trên máy đã kết nối database để tạo Admin đầu tiên bằng lời nhắc nhập trong terminal. Mật khẩu được nhập ẩn.
6. Đăng nhập Admin và tạo tài khoản NV kế hoạch/NV kinh doanh tại `/admin/users`. Để nạp 12 booking mẫu, dùng `npm run db:seed -- --allow-demo-data` chỉ với database dành riêng cho thử nghiệm; script từ chối chạy nếu thiếu cờ xác nhận và tự bỏ qua khi database đã có booking.

### Khôi phục mật khẩu Admin bị quên

Trong PowerShell tại thư mục repo, chạy `vercel env run --environment production -- npm run auth:reset-admin-password`. Lệnh này chỉ đổi mật khẩu cho tài khoản Admin đang hoạt động đã tồn tại, yêu cầu xác nhận email bằng cách gõ `RESET <email>`, nhập mật khẩu mới hai lần (không hiển thị), cập nhật hash Better Auth và thu hồi các phiên cũ. Nó không tạo tài khoản, không hiển thị/ghi mật khẩu vào log và không thay đổi `BETTER_AUTH_SECRET`. Chỉ người có quyền Vercel Production mới lấy được kết nối database cần thiết. Sau khi hoàn tất, đăng nhập lại bằng mật khẩu vừa nhập.

Không chạy seed trên database có dữ liệu vận hành. Không đưa `.env.local` hoặc thông tin Neon vào Git/Vercel source.

## Triển khai Vercel + Neon

- Ứng dụng production: <https://kdbt-app-dat-hang-five.vercel.app/login>.
- Repo công khai: <https://github.com/vohanh19902026-droid/kdbt-app-dat-hang>.
- Trạng thái production và kết nối Neon được xác minh qua deployment mới nhất trong Vercel; `/api/health` phải trả `status: ok`, `database: up`.
- Database production hiện chỉ có tài khoản Admin khởi tạo; chưa có tài khoản nhân viên, khách hàng hoặc booking. Không dùng dữ liệu mẫu trên production.
- Vercel cần `DATABASE_URL`, `BETTER_AUTH_SECRET` và `BETTER_AUTH_URL`. Build command `npm run build`, framework Next.js. `BETTER_AUTH_SECRET` phải là secret ngẫu nhiên dài ít nhất 32 ký tự; không đưa secret vào Git, tài liệu, chat hoặc ảnh chụp.
- Các migration được quản lý qua `npm run db:migrate`; script áp theo thứ tự, ghi nhận migration đã chạy và có chế độ xem trước `npx tsx scripts/apply-migrations.ts --dry`.
- Các schema thay đổi được quản lý bằng `drizzle/0000`–`0004`; trước khi chạy migration trên Neon, xác nhận đúng database và dùng `npx tsx scripts/apply-migrations.ts --dry` để xem trước. Chế độ dry-run chỉ đọc database.
- Admin đầu tiên đã được tạo trên database theo biên bản triển khai ngày 2026-11-02. Không lưu mật khẩu tài khoản trong repo. Admin đăng nhập và tạo tài khoản nội bộ ở `/admin/users`; người dùng có thể tự đổi mật khẩu trong menu tài khoản.
- PWA cài từ trình duyệt cần HTTPS; service worker chỉ lưu màn offline và icon, không cache trang/API chứa dữ liệu riêng.

## Quy trình MVP

- Kinh doanh đăng nhập trên mobile, tạo booking gồm khách hàng, địa chỉ, liên hệ, khối lượng, mác, cát/đá, thời điểm yêu cầu, xe bơm, xe chở/chuyến và ghi chú. Mã `BOOK-####` do PostgreSQL sequence sinh nguyên tử.
- Admin cấu hình mác bê tông, danh mục cát/đá, loại bơm, dung tích xe chở và hạng mục đổ trong phần Cài đặt; các booking cũ giữ nguyên dữ liệu đã chụp tại thời điểm đặt.
- Kế hoạch/Admin xem booking theo ngày trên lưới Tabulator, sửa trực tiếp ngày cấp, giờ, khối lượng, vật liệu, xe bơm/xe phục vụ, ghi chú và trạng thái. Mỗi cập nhật được ghi `order_events`; `version` do trình duyệt gửi lên ngăn ghi đè khi hai người sửa cùng lúc.
- Kế hoạch/Admin xuất workbook `.xlsx` thật với tiêu đề gộp, định dạng, bộ lọc, cố định hàng tiêu đề, tổng khối lượng và thiết lập in ngang A3. Bảng kế hoạch và tệp xuất lọc theo ngày cấp hàng (`planned_start_at`), đơn chưa xếp lịch rơi về ngày yêu cầu.
- Admin tạo/khóa tài khoản và phân quyền; có thể đặt lại mật khẩu nhân viên, thao tác này thu hồi các phiên đăng nhập hiện tại. Public signup bị tắt. Kế toán/Admin ghi tăng khoản phải thu và ghi nhận tiền thu bằng giao dịch VND append-only; có thể gắn booking, số hóa đơn/phiếu thu và diễn giải. Hệ thống không tự tính giá từ m³, không lập hóa đơn và không thay thế phần mềm kế toán.

## Vai trò

- `ADMIN`: quản lý tài khoản, booking, bảng kế hoạch và export.
- `PLANNER`: xem và xử lý mọi booking, sửa/xếp lịch, export.
- `SALES`: tạo booking và chỉ xem booking của mình.
- `ACCOUNTANT`: xem/ghi sổ công nợ và báo cáo; không được sửa booking hoặc quản lý người dùng.

## Nền tham khảo và phần riêng

Xem [`docs/base-app-evaluation.md`](docs/base-app-evaluation.md) để biết nền nguồn mở được chọn, những gì được tái sử dụng và phần viết riêng. Mô hình dữ liệu/quyết định kiến trúc nằm ở [`docs/architecture.md`](docs/architecture.md) và [`docs/data-model.md`](docs/data-model.md). License nền Better Auth Starter được giữ tại [`LICENSE-ZEXA`](LICENSE-ZEXA); thông báo thư viện tại [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

## Trạng thái vận hành hiện tại

- Repo công khai trên GitHub và deployment Vercel được quản lý qua nhánh `main`; cần kiểm tra trạng thái deployment mới nhất trong Vercel trước mỗi lần phát hành. Health check production xác nhận kết nối Neon hoạt động.
- Lần kiểm tra local ngày 2026-11-02: `npm run typecheck`, `npm run lint`, `npm test` và `npm run build` đều đạt.
- UAT local với 13 booking đã xác nhận mã booking, xếp lịch, phương tiện, lịch sử và công nợ. Workbook theo source hiện tại có sheet `Kế hoạch cấp`, 22 cột, gồm ghi chú kinh doanh/kế hoạch, loại bơm, giờ yêu cầu và trạng thái.
- Database production giữ sạch dữ liệu thử nghiệm: chỉ có Admin, chưa có nhân viên, khách hàng hay booking. Dùng `/admin/users` để tạo tài khoản theo danh sách nhân sự thật trước khi vận hành.
- Ứng dụng có security headers, CSP production, chặn Origin lạ trên API ghi dữ liệu và giới hạn truy vấn theo ngày. `/orders` đã được sửa lỗi SSR của Tabulator; có health check, error/loading boundary, lịch sử booking, báo cáo khoảng ngày và đổi mật khẩu tự phục vụ.
- P1/P2 gồm: giới hạn đăng nhập 5 lần/phút (bộ đếm in-memory theo instance Vercel), structured error logs không ghi message/secret, phân hệ sổ công nợ, hồ sơ nhân viên, quyền lọc công nợ theo NVKD và công cụ Admin đặt lại mật khẩu có thu hồi phiên.
- Trước khi nhập dữ liệu vận hành: Admin cần đặt mật khẩu riêng, tạo tài khoản NV kế hoạch/NVKD và kế toán theo nhân sự thật, rồi kiểm tra backup/restore Neon và diễn tập với nhân viên.
- Mẫu XLSX được dựng theo ảnh tham khảo; độ rộng/nhóm màu có thể điều chỉnh theo workbook gốc nếu có file Excel chuẩn.
