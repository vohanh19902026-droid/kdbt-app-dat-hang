# Lộ trình đưa CENCOM vào vận hành

## Đã có trong ứng dụng

- Đăng nhập nội bộ và phân quyền Admin, Kế hoạch, Kinh doanh, Kế toán.
- NVKD tạo booking trên điện thoại; mã booking được PostgreSQL cấp tự động.
- Kế hoạch duyệt booking, chỉnh giờ cấp, giao phương tiện và theo dõi lịch sử trên bảng desktop.
- Xuất bảng kế hoạch `.xlsx` theo mẫu nghiệp vụ; Kế toán/Admin ghi sổ công nợ và xuất sổ.
- PWA có thể cài trên điện thoại/tablet; các trang và API mang dữ liệu không được lưu vào cache offline.
- Admin quản lý tài khoản/hồ sơ nhân viên, thương hiệu/giao diện và danh mục mác, cát, đá, bơm, dung tích xe, hạng mục.
- Báo cáo sản lượng phân biệt khách hàng theo nhân viên kinh doanh phụ trách.

## Bằng chứng kỹ thuật gần nhất

- `npm test`: 39/39 đạt.
- `npm run lint`: đạt.
- `npm run typecheck`: đạt.
- `npm run build`: đạt với Next.js 16.4.3.
- Production health check: `status: ok`, `database: up`; production database hiện chỉ có Admin, chưa có nhân viên, khách hàng hay booking thật.
- UAT local trước đây đã chạy luồng booking → xếp lịch → ghi công nợ → xuất XLSX và kiểm tra chặn quyền chéo. Dữ liệu UAT nằm ở PostgreSQL local, tách khỏi Neon production.

## Việc cần làm để bắt đầu vận hành thật

1. Admin đổi mật khẩu khởi tạo của chính mình; người dùng tự nhập và gửi thông tin đăng nhập.
2. Admin tạo tài khoản cho nhân viên theo danh sách thật, gán đúng vai trò, mã nhân viên, số điện thoại và bộ phận.
3. Admin chỉnh danh mục vật liệu/mác/bơm/dung tích xe theo quy cách CENCOM.
4. Nhập khách hàng thật và giao khách cho NVKD phụ trách trước khi ghi nhận công nợ.
5. NVKD và kế hoạch diễn tập một đơn thật quy mô nhỏ trên điện thoại và máy tính; xác nhận lại file XLSX với mẫu Excel gốc của công ty.
6. Xác nhận quy trình backup/restore Neon trước khi nhập dữ liệu vận hành diện rộng.

## Giới hạn còn lại

- Thông báo đẩy/email, xử lý booking ngoại tuyến, hóa đơn/thuế và phân bổ một khoản thu cho nhiều hóa đơn chưa triển khai.
- Phương tiện được nhập theo từng booking vì chưa có danh sách đội xe chuẩn; danh mục đội xe có thể bổ sung sau khi nhận dữ liệu phương tiện thật.
- XLSX hiện dựng theo ảnh tham khảo; cần workbook gốc để xác nhận chính xác độ rộng, màu và nhóm tiêu đề.
- Chưa có thông tin nhân sự và danh sách khách hàng thật để tạo dữ liệu vận hành production. Không tạo dữ liệu giả trên Neon.
