# CONTEXT — Morning Brief (reset mỗi phiên)

> Trạng thái hiện hành; không chép secret hoặc mật khẩu vào file này.

## Phiên: 2026-11-02

- Mục tiêu: hoàn thiện app đặt hàng/điều phối bê tông và đưa vào vận hành theo quy trình thực tế của CENCOM.
- Repo: `E:\DỰ ÁN CÔNG TY\3. kdbt-app-dat-hang`, nhánh `main`, commit hiện tại `62b4422` (`feat: let admins configure concrete booking catalogs`). Working tree sạch.
- GitHub: `vohanh19902026-droid/kdbt-app-dat-hang`; Vercel CLI đăng nhập đúng team `vohanh19902026-droid`.
- Production: <https://kdbt-app-dat-hang-five.vercel.app/>. Deployment commit `62b4422` đã Ready; `/api/health` trả `status: ok`, `database: up`.
- Giao diện production bằng phiên Admin đã xác nhận tab “Danh mục đặt hàng” và form booking dùng danh mục mác, cát/đá, xe bơm, dung tích xe và hạng mục. Không gửi booking thử lên production.
- Production hiện có một Admin; chưa có nhân viên kinh doanh/kế hoạch/kế toán, khách hàng hoặc booking thật. Không tạo dữ liệu giả trên Neon.
- Tính năng đã triển khai: đăng nhập/role, booking có mã sequence, bảng kế hoạch Tabulator, duyệt/xếp giờ/gán xe, lịch sử, XLSX, PWA, quản lý user, công nợ, báo cáo, điều chỉnh giao diện và danh mục nghiệp vụ.
- Kiểm tra gần nhất trên source triển khai: 39/39 tests, lint, typecheck và production build đều đạt.
- PostgreSQL local `cencom_accounting_test` ở `127.0.0.1:55432` là dữ liệu UAT tách biệt (1 user, 13 orders, 13 customers tại lần kiểm tra này). Không dùng dữ liệu này cho production.
- Trạng thái còn cần đầu vào thật: Admin tự đổi mật khẩu khởi tạo; tạo tài khoản nhân viên với hồ sơ đúng; xác nhận danh mục và đội xe thực tế; tạo/giao khách hàng thật cho NVKD; diễn tập đơn thật trên điện thoại/tablet; đối chiếu XLSX với file Excel gốc; xác nhận backup/restore Neon.
- `.env.local` có thể chứa thông tin kết nối Neon và Better Auth; không đọc/ghi log giá trị, không gửi ra chat, không commit.
