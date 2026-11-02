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

- Tạo database PostgreSQL trên Neon, đặt `DATABASE_URL` và `BETTER_AUTH_SECRET` trong Vercel Environment Variables cho Preview/Production.
- Đặt `BETTER_AUTH_URL` theo domain deploy. Áp dụng schema `drizzle/0000_initial.sql` và `drizzle/0001_planning_basis_index.sql` trong Neon SQL Editor (hoặc dùng `npm run db:push` từ máy đã cấu hình Neon).
- Project hiện đã kết nối Neon và deployment thử nghiệm trên Vercel. URL: <https://kdbt-app-dat-hang-five.vercel.app>.
- Build command `npm run build`, framework Next.js. `BETTER_AUTH_SECRET` cần là secret ngẫu nhiên dài ít nhất 32 ký tự; không đưa secret vào Git, chat hoặc ảnh chụp.
- Sau khi deployment ở trạng thái Ready, tạo Admin đầu tiên rồi tạo tài khoản nội bộ. Để chạy script tạo Admin trên máy cục bộ, cần `DATABASE_URL` trong `.env.local`. Nếu đã đăng nhập Vercel CLI và project đã được link, có thể chạy `npx vercel env pull .env.local --environment production`; file này đã bị loại khỏi Git.
- PWA cài từ trình duyệt cần HTTPS; service worker chỉ lưu màn offline và icon, không cache trang/API chứa dữ liệu riêng.

## Quy trình MVP

- Kinh doanh đăng nhập trên mobile, tạo booking gồm khách hàng, địa chỉ, liên hệ, khối lượng, mác, cát/đá, thời điểm yêu cầu, xe bơm, xe chở/chuyến và ghi chú. Mã `BOOK-####` do PostgreSQL sequence sinh nguyên tử.
- Kế hoạch/Admin xem booking theo ngày trên lưới Tabulator, sửa trực tiếp ngày cấp, giờ, khối lượng, vật liệu, xe bơm/xe phục vụ, ghi chú và trạng thái. Mỗi cập nhật được ghi `order_events`; `version` do trình duyệt gửi lên ngăn ghi đè khi hai người sửa cùng lúc.
- Kế hoạch/Admin xuất workbook `.xlsx` thật với tiêu đề gộp, định dạng, bộ lọc, cố định hàng tiêu đề, tổng khối lượng và thiết lập in ngang A3. Bảng kế hoạch và tệp xuất lọc theo ngày cấp hàng (`planned_start_at`), đơn chưa xếp lịch rơi về ngày yêu cầu.
- Admin tạo/khóa tài khoản và phân quyền. Public signup bị tắt. Vai trò kế toán có sẵn trong mô hình nhưng khu vực công nợ mới là placeholder.

## Vai trò

- `ADMIN`: quản lý tài khoản, booking, bảng kế hoạch và export.
- `PLANNER`: xem và xử lý mọi booking, sửa/xếp lịch, export.
- `SALES`: tạo booking và chỉ xem booking của mình.
- `ACCOUNTANT`: dành cho giai đoạn đối soát công nợ; chưa mở API kế toán.

## Nền tham khảo và phần riêng

Xem [`docs/base-app-evaluation.md`](docs/base-app-evaluation.md) để biết nền nguồn mở được chọn, những gì được tái sử dụng và phần viết riêng. Mô hình dữ liệu/quyết định kiến trúc nằm ở [`docs/architecture.md`](docs/architecture.md) và [`docs/data-model.md`](docs/data-model.md). License nền Better Auth Starter được giữ tại [`LICENSE-ZEXA`](LICENSE-ZEXA); thông báo thư viện tại [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

## Trạng thái vận hành hiện tại

- `npm run typecheck`, ESLint, `npm test` (23 bài) và `npm run build` đã chạy thành công ngày 2026-11-02. Build cục bộ được kiểm tra bằng giá trị secret thử nghiệm riêng, không phải secret production.
- E2E HTTP trên bản production với PostgreSQL tạm: 37/37 kiểm tra P0 (đăng nhập, RBAC, tạo booking, dời ngày, chống ghi đè, xuất XLSX) và 14/14 kiểm tra P1 (health check, lịch sử thay đổi, chặn truy cập trái quyền).
- Ứng dụng đã có security headers, CSP ở production, chặn Origin lạ trên API ghi dữ liệu và giới hạn truy vấn theo ngày.
- Đã sửa lỗi SSR khiến `/orders` trả HTTP 500: Tabulator được nạp động trong `useEffect`. Thêm `GET /api/health`, error/loading boundary và màn hình lịch sử thay đổi booking.
- Vercel project `cencom-os/kdbt-app-dat-hang` đã link nhưng **chưa có biến môi trường**; cần đặt `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` rồi chạy 2 migration, tạo Admin và `vercel --prod`.
- Mẫu XLSX được dựng theo ảnh tham khảo; độ rộng/nhóm màu có thể điều chỉnh theo workbook gốc nếu có file Excel chuẩn.
