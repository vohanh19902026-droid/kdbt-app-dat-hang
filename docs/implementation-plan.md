# Lộ trình đưa CENCOM vào vận hành

## Đã có trong ứng dụng

- Đăng nhập nội bộ và phân quyền Admin, Kế hoạch, Kinh doanh, Kế toán.
- NVKD tạo booking trên điện thoại; mã booking được PostgreSQL cấp tự động.
- Kế hoạch duyệt booking, chỉnh giờ cấp, giao phương tiện và theo dõi lịch sử trên bảng desktop.
- Xuất bảng kế hoạch `.xlsx` theo mẫu nghiệp vụ; Kế toán/Admin quản lý sổ công nợ và xuất sổ. NVKD xem công nợ khách hàng được giao, ghi nhận tiền đã thu và xuất dữ liệu trong phạm vi phụ trách.
- PWA có thể cài trên điện thoại/tablet; các trang và API mang dữ liệu không được lưu vào cache offline.
- Admin quản lý tài khoản/hồ sơ nhân viên, thương hiệu/giao diện và danh mục mác, cát, đá, bơm, dung tích xe, hạng mục.
- Báo cáo sản lượng phân biệt khách hàng theo nhân viên kinh doanh phụ trách.
- Admin tải mẫu `.xlsx` tiếng Việt, xem trước tối đa 200 khách/lần, ghép chủ sở hữu theo email/mã NVKD đang hoạt động, bỏ qua khách trùng và nhập hợp lệ theo một yêu cầu có kiểm tra quyền. Admin/Kế hoạch xuất danh mục bằng workbook `.xlsx` đã định dạng; PostgreSQL/Neon lưu dữ liệu vận hành.

## Bằng chứng kỹ thuật gần nhất

- `npm test`: 44/44 đạt, gồm tạo/đọc mẫu XLSX, kiểm tra dữ liệu nhập và workbook xuất danh mục.
- `npm run lint`: đạt.
- `npm run typecheck`: đạt.
- `npm run build`: đạt với Next.js 16.4.3.
- Production health check gần nhất: `status: ok`, `database: up`. Đã tạo ba tài khoản UAT production để kiểm tra quyền theo vai trò; hiện có khách hàng/booking smoke test `BOOK-7431`, trạng thái Đã hủy. Các dữ liệu này không phải dữ liệu vận hành thật.
- UAT local trước đây đã chạy luồng booking → xếp lịch → ghi công nợ → xuất XLSX và kiểm tra chặn quyền chéo. Dữ liệu UAT nằm ở PostgreSQL local, tách khỏi Neon production.

## Việc cần làm để bắt đầu vận hành thật

1. Admin đổi mật khẩu khởi tạo; gửi tài khoản và mật khẩu tạm của nhân viên qua kênh riêng, yêu cầu từng người tự đổi mật khẩu.
2. Admin tạo tài khoản cho nhân viên theo danh sách thật, gán đúng vai trò, mã nhân viên, số điện thoại và bộ phận. Sau khi hoàn tất UAT, khóa ba tài khoản `uat.*`.
3. Admin chỉnh danh mục vật liệu/mác/bơm/dung tích xe theo quy cách CENCOM.
4. Tải mẫu XLSX, điền danh sách khách hàng thật và giao khách cho NVKD phụ trách trước khi ghi nhận công nợ.
5. NVKD và kế hoạch diễn tập một đơn thật quy mô nhỏ trên điện thoại và máy tính; xác nhận lại file XLSX với mẫu Excel gốc của công ty.
6. Xác nhận quy trình backup/restore Neon trước khi nhập dữ liệu vận hành diện rộng.

## Giới hạn còn lại

- Thông báo đẩy/email, xử lý booking ngoại tuyến, hóa đơn/thuế và phân bổ một khoản thu cho nhiều hóa đơn chưa triển khai.
- Phương tiện được nhập theo từng booking vì chưa có danh sách đội xe chuẩn; danh mục đội xe có thể bổ sung sau khi nhận dữ liệu phương tiện thật.
- XLSX hiện dựng theo ảnh tham khảo; cần workbook gốc để xác nhận chính xác độ rộng, màu và nhóm tiêu đề.
- Chưa có thông tin nhân sự và danh sách khách hàng thật để tạo dữ liệu vận hành production. Không tạo dữ liệu giả trên Neon.
