# CENCOM · Đặt hàng và điều phối bê tông

Ứng dụng web responsive cho kinh doanh đặt bê tông trên điện thoại/PWA và kế hoạch điều phối trên máy tính. Nền khung dùng Next.js + Better Auth + Drizzle ORM + PostgreSQL (Neon). Phần riêng của CENCOM là quy trình booking bê tông, phân quyền nghiệp vụ, bảng kế hoạch và tệp XLSX theo mẫu tham khảo.

## Chạy local

Yêu cầu Node.js 20.9 trở lên và PostgreSQL/Neon.

1. `npm install`
2. Sao chép `.env.example` thành `.env.local`, điền `DATABASE_URL`, `BETTER_AUTH_SECRET` (ít nhất 32 ký tự) và `BETTER_AUTH_URL`.
3. Chạy toàn bộ `drizzle/0000_initial.sql` trong Neon SQL Editor (hoặc dùng `npm run db:push` trên database trống).
4. `npm run dev`, mở `http://localhost:3000`.
5. Chạy `npm run auth:create-admin` trên máy đã kết nối database để tạo Admin đầu tiên bằng lời nhắc nhập trong terminal. Mật khẩu được nhập ẩn.
6. Đăng nhập Admin và tạo tài khoản NV kế hoạch/NV kinh doanh tại `/admin/users`. `npm run db:seed` nạp 12 booking mẫu vào database trống để chạy demo.

Không chạy seed trên database có dữ liệu vận hành. Không đưa `.env.local` hoặc thông tin Neon vào Git/Vercel source.

## Triển khai thử trên Vercel + Neon

- Tạo database PostgreSQL trên Neon, đặt `DATABASE_URL` và `BETTER_AUTH_SECRET` trong Vercel Environment Variables cho Preview/Production.
- Đặt `BETTER_AUTH_URL` theo domain deploy. Áp dụng một lần schema `drizzle/0000_initial.sql` trong Neon SQL Editor (hoặc dùng `npm run db:push` từ máy đã cấu hình Neon).
- Project hiện đã kết nối Neon và deployment thử nghiệm trên Vercel. URL: <https://kdbt-app-dat-hang-five.vercel.app>.
- Build command `npm run build`, framework Next.js. `BETTER_AUTH_SECRET` cần là secret ngẫu nhiên dài ít nhất 32 ký tự; không đưa secret vào Git, chat hoặc ảnh chụp.
- Sau khi deployment ở trạng thái Ready, tạo Admin đầu tiên rồi tạo tài khoản nội bộ. Để chạy script tạo Admin trên máy cục bộ, cần `DATABASE_URL` trong `.env.local`. Nếu đã đăng nhập Vercel CLI và project đã được link, có thể chạy `npx vercel env pull .env.local --environment production`; file này đã bị loại khỏi Git.
- PWA cài từ trình duyệt cần HTTPS; service worker chỉ lưu màn offline và icon, không cache trang/API chứa dữ liệu riêng.

## Quy trình MVP

- Kinh doanh đăng nhập trên mobile, tạo booking gồm khách hàng, địa chỉ, liên hệ, khối lượng, mác, cát/đá, thời điểm yêu cầu, xe bơm, xe chở/chuyến và ghi chú. Mã `BOOK-####` do PostgreSQL sequence sinh nguyên tử.
- Kế hoạch/Admin xem booking theo ngày trên lưới Tabulator, sửa trực tiếp giờ, khối lượng, vật liệu, xe bơm/xe phục vụ, ghi chú và trạng thái. Mỗi cập nhật được ghi `order_events`; cập nhật cạnh tranh bị từ chối để tránh ghi đè im lặng.
- Kế hoạch/Admin xuất workbook `.xlsx` thật với tiêu đề gộp, định dạng, bộ lọc, cố định hàng tiêu đề, tổng khối lượng và thiết lập in ngang A3.
- Admin tạo/khóa tài khoản và phân quyền. Public signup bị tắt. Vai trò kế toán có sẵn trong mô hình nhưng khu vực công nợ mới là placeholder.

## Vai trò

- `ADMIN`: quản lý tài khoản, booking, bảng kế hoạch và export.
- `PLANNER`: xem và xử lý mọi booking, sửa/xếp lịch, export.
- `SALES`: tạo booking và chỉ xem booking của mình.
- `ACCOUNTANT`: dành cho giai đoạn đối soát công nợ; chưa mở API kế toán.

## Nền tham khảo và phần riêng

Xem [`docs/base-app-evaluation.md`](docs/base-app-evaluation.md) để biết nền nguồn mở được chọn, những gì được tái sử dụng và phần viết riêng. Mô hình dữ liệu/quyết định kiến trúc nằm ở [`docs/architecture.md`](docs/architecture.md) và [`docs/data-model.md`](docs/data-model.md). License nền Better Auth Starter được giữ tại [`LICENSE-ZEXA`](LICENSE-ZEXA); thông báo thư viện tại [`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).

## Trạng thái vận hành hiện tại

- `npm run typecheck`, ESLint cho script khởi tạo Admin, và `npm run build` đã chạy thành công. Build cục bộ được kiểm tra bằng giá trị secret thử nghiệm riêng, không phải secret production.
- Neon đã có schema và Vercel đã có deployment Ready theo lần triển khai gần nhất.
- Cần hoàn tất khởi tạo Admin từ máy có `DATABASE_URL` hợp lệ và diễn tập luồng NVKD → kế hoạch → xuất XLSX trước khi nhập dữ liệu vận hành.
- Mẫu XLSX được dựng theo ảnh tham khảo; độ rộng/nhóm màu có thể điều chỉnh theo workbook gốc nếu có file Excel chuẩn.
