# CENCOM · Đặt hàng và điều phối bê tông

Ứng dụng web responsive cho kinh doanh đặt bê tông trên điện thoại/PWA và kế hoạch điều phối trên máy tính. Nền khung dùng Next.js + Better Auth + Drizzle ORM + PostgreSQL (Neon). Phần riêng của CENCOM là quy trình booking bê tông, phân quyền nghiệp vụ, bảng kế hoạch và tệp XLSX theo mẫu tham khảo.

## Chạy local

Yêu cầu Node.js 20.9 trở lên và PostgreSQL/Neon.

1. `npm install`
2. Sao chép `.env.example` thành `.env.local`, điền `DATABASE_URL`, `BETTER_AUTH_SECRET` (ít nhất 32 ký tự) và `BETTER_AUTH_URL`.

### Đăng nhập Google

Tạo OAuth Client ID loại Web application trong Google Cloud. Thêm callback `https://YOUR_DOMAIN/api/auth/callback/google` (và URL tương ứng cho Preview nếu dùng OAuth trên Preview), sau đó đặt `GOOGLE_CLIENT_ID` và `GOOGLE_CLIENT_SECRET` dạng Sensitive trong Vercel cho đúng môi trường. Không đưa client secret vào Git hoặc chat. Đăng nhập Google chỉ chấp nhận email được Google xác minh; email khớp tài khoản hiện có sẽ liên kết với tài khoản đó. Người đăng ký mới cần hoàn tất hồ sơ (họ tên, bộ phận, chức vụ và vai trò đề nghị) rồi chờ Admin duyệt; chưa được vào không gian làm việc trước khi được kích hoạt. Tài khoản đăng nhập Google không có mật khẩu CENCOM để đặt lại; nếu quên mật khẩu Google, hãy dùng trang khôi phục của Google.
3. Chạy `npm run db:migrate` để áp các migration còn thiếu theo thứ tự. Với database trống, lệnh này tạo toàn bộ schema hiện hành; không chạy `db:seed` trên database vận hành.
4. `npm run dev`, mở `http://localhost:3000`.
5. Chạy `npm run auth:create-admin` trên máy đã kết nối database để tạo Admin đầu tiên bằng lời nhắc nhập trong terminal. Mật khẩu được nhập ẩn.
6. Đăng nhập Admin và tạo tài khoản NV kế hoạch/NV kinh doanh tại `/admin/users`. Để nạp 12 booking mẫu, dùng `npm run db:seed -- --allow-demo-data` chỉ với database dành riêng cho thử nghiệm; script từ chối chạy nếu thiếu cờ xác nhận và tự bỏ qua khi database đã có booking.

### Người dùng tự khôi phục mật khẩu

Trang đăng nhập có mục **Quên mật khẩu?**. Người dùng nhập email tài khoản; nếu tài khoản đang hoạt động, CENCOM gửi liên kết xác minh một lần, hết hạn sau 30 phút. Khi đổi mật khẩu, các phiên đăng nhập cũ bị thu hồi. App không yêu cầu xác minh email cho toàn bộ tài khoản hiện hữu, tránh khóa những tài khoản đã được Admin tạo trước khi bật tính năng này.

Để gửi thư bằng Gmail/Google Workspace, bật SMTP trên mailbox gửi và cấu hình các biến `SMTP_HOST` (`smtp.gmail.com`), `SMTP_PORT` (`465`), `SMTP_SECURE` (`true`), `SMTP_USER`, `SMTP_APP_PASSWORD` và `MAIL_FROM` trong Vercel. Chỉ đặt `SMTP_APP_PASSWORD` trong Vercel Environment Variables dạng Sensitive, tách riêng Preview và Production; không đưa vào repo, `.env.example`, chat hoặc log. Dùng mailbox gửi chuyên dụng cho CENCOM, không dùng mật khẩu đăng nhập Google. Với Gmail cá nhân, App Password yêu cầu bật Xác minh 2 bước; Google đánh giá App Password kém an toàn hơn OAuth và không khuyến nghị nếu app hỗ trợ đăng nhập Google. Xem [hướng dẫn Google về App Password](https://support.google.com/mail/answer/185833), [cấu hình email Better Auth](https://better-auth.com/docs/concepts/email) và [khuyến nghị gửi email trên Vercel](https://vercel.com/kb/guide/serverless-functions-and-smtp).

### Khôi phục mật khẩu Admin bằng terminal

Nếu Admin chưa thể nhận email khôi phục, mở PowerShell ở thư mục repo và chạy `vercel env run -e production -- npm.cmd run auth:reset-admin-password`. Lệnh này chỉ đổi mật khẩu cho tài khoản Admin đang hoạt động đã tồn tại, yêu cầu xác nhận email bằng cách gõ `RESET <email>`, nhập mật khẩu mới hai lần (không hiển thị), cập nhật hash Better Auth và thu hồi các phiên cũ. Nó không tạo tài khoản, không hiển thị/ghi mật khẩu vào log và không thay đổi `BETTER_AUTH_SECRET`. Chỉ người có quyền Vercel Production mới lấy được kết nối database cần thiết. Sau khi hoàn tất, đăng nhập lại bằng mật khẩu vừa nhập.

Không chạy seed trên database có dữ liệu vận hành. Không đưa `.env.local` hoặc thông tin Neon vào Git/Vercel source.

## Triển khai Vercel + Neon

- Ứng dụng production: <https://kdbt-app-dat-hang-five.vercel.app/login>.
- Repo công khai: <https://github.com/vohanh19902026-droid/kdbt-app-dat-hang>.
- Trạng thái production và kết nối Neon được xác minh qua deployment mới nhất trong Vercel; `/api/health` phải trả `status: ok`, `database: up`.
- Database production hiện có tài khoản Admin và ba tài khoản UAT; có một khách hàng cùng booking smoke test `BOOK-7431` đã hủy. Đây là dữ liệu kiểm thử, không dùng để vận hành. Admin cần đổi mật khẩu khởi tạo, tạo tài khoản nhân sự thật và nhập danh sách khách hàng thật trước khi vận hành.
- Production dùng `DATABASE_URL` của môi trường Production. Preview của nhánh `codex/cencom-owner-preview` hiện lấy `DATABASE_URL` do Neon integration cấp riêng theo nhánh; trước khi migration, code đối chiếu project ID, endpoint ID và tên database với các biến pin Preview. Có thể đặt `PREVIEW_DATABASE_URL` làm override riêng. Không dùng URL Production cho Preview hoặc ngược lại. Build command `npm run build`, framework Next.js. `BETTER_AUTH_SECRET` phải là secret ngẫu nhiên dài ít nhất 32 ký tự; không đưa secret vào Git, tài liệu, chat hoặc ảnh chụp.
- Các migration được quản lý qua `npm run db:migrate`; script áp theo thứ tự, ghi nhận migration đã chạy và có chế độ xem trước `npx tsx scripts/apply-migrations.ts --dry`.
- Các schema thay đổi được quản lý bằng các file versioned trong `drizzle/`; trước khi chạy migration trên Neon, xác nhận đúng database và dùng lệnh dry-run phù hợp môi trường. Không chạy lệnh migration Production như dry-run trên DB Production. Chế độ dry-run chỉ đọc database.
- Admin đầu tiên đã được tạo trên database theo biên bản triển khai ngày 2026-11-02. Không lưu mật khẩu tài khoản trong repo. Admin đăng nhập và tạo tài khoản nội bộ ở `/admin/users`; người dùng có thể tự đổi mật khẩu trong menu tài khoản.
- PWA cài từ trình duyệt cần HTTPS; service worker chỉ lưu màn offline và icon, không cache trang/API chứa dữ liệu riêng.

## Quy trình MVP

- Kinh doanh đăng nhập trên mobile, tạo booking gồm khách hàng, địa chỉ, liên hệ, khối lượng, mác, cát/đá, thời điểm yêu cầu, xe bơm, xe chở/chuyến và ghi chú. Mã `BOOK-####` do PostgreSQL sequence sinh nguyên tử.
- Admin cấu hình mác bê tông, danh mục cát/đá, loại bơm, phương tiện phục vụ gợi ý cho kế hoạch, dung tích xe chở và hạng mục đổ trong phần Cài đặt. Lưới kế hoạch dùng cùng các danh mục gợi ý; vẫn có thể nhập ngoại lệ, còn danh mục dung tích xe tối đa 30 m³ khớp giới hạn lưu của API. Booking cũ giữ nguyên dữ liệu đã chụp tại thời điểm đặt.
- Admin quản lý danh mục khách hàng tại `/customers`, tải mẫu nhập `.xlsx` tiếng Việt, xem trước và nhập tối đa 200 khách/lần, rồi giao từng khách cho NVKD qua email hoặc mã nhân viên đang hoạt động. Admin/Kế hoạch xuất danh mục khách hàng thành workbook `.xlsx` có tiêu đề, bộ lọc và định dạng cột. PostgreSQL/Neon là nơi lưu dữ liệu vận hành; CSV không dùng làm định dạng nhập/xuất cho người dùng.
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
- Lần kiểm tra local ngày 2026-11-03: `npm run typecheck`, `npm run lint`, `npm test` (53/53) và `npm run build` đều đạt; `npm audit --omit=dev --audit-level=moderate` không phát hiện lỗ hổng.
- UAT local với 13 booking đã xác nhận mã booking, xếp lịch, phương tiện, lịch sử và công nợ. Workbook theo source hiện tại có sheet `Kế hoạch cấp`, 25 cột, tách hạng mục cấu kiện khỏi hình thức đổ và loại công trình, tách người liên hệ và điểm đổ, có ghi chú kinh doanh/kế hoạch, bộ lọc, tổng công thức và màu phân cột cốt liệu/phương tiện.
- Phiên bản 1.1.0 bổ sung nhận đơn theo ngày, danh mục Admin có trạng thái dùng/ngừng, hạng mục cấu kiện, hình thức đổ, loại công trình, danh mục kỹ thuật và bảng giám sát hệ thống. Neon Production đã áp migration `0005`–`0009`; Vercel Preview chưa có `DATABASE_URL` riêng và được giữ tách biệt khỏi Production. Xem [đánh giá phát hành](docs/release-assessment-2026-11-03.md).
- Database production hiện có Admin và ba tài khoản UAT (`uat.sales@cencom.vn`, `uat.planner@cencom.vn`, `uat.accounting@cencom.vn`); có một khách hàng và booking smoke test `BOOK-7431` đang ở trạng thái Đã hủy. Không dùng các tài khoản/dữ liệu UAT làm dữ liệu vận hành. Admin cần đổi mật khẩu khởi tạo, tạo tài khoản nhân sự thật và nhập danh sách khách hàng thật trước khi vận hành.
- Ứng dụng có security headers, CSP production, chặn Origin lạ trên API ghi dữ liệu và giới hạn truy vấn theo ngày. `/orders` đã được sửa lỗi SSR của Tabulator; có health check, error/loading boundary, lịch sử booking, báo cáo khoảng ngày và đổi mật khẩu tự phục vụ.
- P1/P2 gồm: giới hạn đăng nhập 5 lần/phút (bộ đếm in-memory theo instance Vercel), structured error logs không ghi message/secret, phân hệ sổ công nợ, hồ sơ nhân viên, quyền lọc công nợ theo NVKD và công cụ Admin đặt lại mật khẩu có thu hồi phiên.
- Trước khi nhập dữ liệu vận hành: Admin cần đổi mật khẩu khởi tạo, tạo tài khoản NV kế hoạch/NVKD và kế toán theo nhân sự thật, nhập khách hàng, rà soát danh mục cấp hàng, rồi kiểm tra backup/restore Neon và diễn tập với nhân viên. Sau UAT, khóa các tài khoản `uat.*` và dọn bản ghi smoke theo quy trình lưu trữ.
- Mẫu XLSX được căn theo ảnh tham khảo. Cần đối chiếu file Excel gốc để nghiệm thu chính xác độ rộng cột, các dải tiêu đề/màu, bố cục in và tên trường chuyên biệt của trạm trộn.
