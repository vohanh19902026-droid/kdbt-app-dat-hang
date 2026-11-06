# License và lộ trình SaaS CENCOM

## Trạng thái hiện tại

CENCOM hiện là ứng dụng nội bộ đơn tenant. Các bảng booking, khách hàng, công nợ, cấu hình và người dùng chưa gắn `tenant_id`; một database tương ứng một công ty. Vercel và Neon đang cung cấp nơi chạy ứng dụng và database, nhưng điều đó chưa tự biến ứng dụng thành SaaS nhiều công ty.

Chưa phát hành license key cho khách hàng. Tạo key trước khi có tenant isolation sẽ tạo cảm giác sản phẩm đã sẵn sàng bán trong khi dữ liệu chưa được tách an toàn.

## Mô hình khuyến nghị

### SaaS dùng tập trung

- CENCOM vận hành ứng dụng trên Vercel và database trên Neon; khách hàng truy cập bằng URL/PWA, không cần cài server hoặc plugin.
- Mỗi công ty là một `tenant`; mỗi booking, khách hàng, công nợ, cấu hình, tài khoản và file đều thuộc một tenant.
- Vai trò `platform owner` chỉ dành cho bên vận hành CENCOM. Admin của khách hàng chỉ quản trị tenant của họ.
- Bên bán tạo license/đơn hàng trong cổng quản trị chủ sở hữu. License quy định tenant, gói, thời hạn, số người dùng và tính năng.
- Khách hàng nhận lời mời hoặc mã kích hoạt dùng một lần. Người đầu tiên xác minh email trở thành Admin của tenant; họ cấu hình công ty và mời nhân viên. Họ không thể tự cấp `platform owner`.
- License và trạng thái thuê bao được kiểm tra trên server. Không tin quyền hoặc số chỗ ngồi gửi từ trình duyệt.

Trong SaaS tập trung, mã kích hoạt chủ yếu giúp nối giao dịch mua với quá trình khởi tạo tenant. Không nên gửi một “master key” có thể tự cấp quyền hoặc mở dữ liệu của mọi tenant.

### Cài đặt riêng cho khách hàng (self-hosted)

Nếu sau này bán bản cài đặt riêng, có thể phát hành license ký số riêng: công cụ phát hành giữ private signing key ngoài ứng dụng; app chỉ chứa public key để xác minh. Claims có thể gồm mã khách hàng, ngày hết hạn, số người dùng và tính năng. Đây là sản phẩm/vận hành khác với SaaS tập trung; không dùng chung bí mật ký số với `BETTER_AUTH_SECRET` hay chìa khóa lạnh.

## Lộ trình triển khai

1. **Giữ bản nội bộ ổn định.** Không đổi database Production hiện tại thành nơi dùng chung cho nhiều khách hàng.
2. **Thiết kế tenant model.** Thêm `tenants`, memberships và tenant-scoped roles; chuyển cấu hình từ singleton sang từng tenant; thêm `tenant_id` vào bảng nghiệp vụ. Tạo tenant CENCOM và backfill dữ liệu hiện tại trong migration có kế hoạch rollback.
3. **Khóa ranh giới dữ liệu.** Mọi page, API, job, export, báo cáo và truy vấn phải lấy tenant từ membership đã xác thực. Thêm kiểm thử truy cập chéo tenant; cân nhắc PostgreSQL Row-Level Security như lớp bảo vệ thứ hai.
4. **Cổng Platform Owner.** Tạo/quản lý tenant, license, gia hạn, giới hạn người dùng, khóa tenant và audit. Tách quyền này khỏi Admin khách hàng và chìa khóa lạnh.
5. **Kích hoạt khách hàng.** Sau khi thanh toán, tạo tenant và mã/lời mời ngẫu nhiên, dùng một lần, lưu hash phía server, có hạn dùng và thu hồi được. Người mua hoàn tất hồ sơ công ty, tạo Admin tenant rồi mời nhân viên.
6. **Chạy thử trên Preview.** Dùng ít nhất hai tenant giả lập, thử import/export, công nợ, thông báo, báo cáo và audit để chứng minh không đọc/ghi chéo dữ liệu. Chỉ sau đó mới lập kế hoạch migration Production và phát hành.

## Vercel, Neon và “plugin”

- Hiện có thể tiếp tục dùng Vercel cho web/API và Neon cho Postgres; chuyển sang SaaS không bắt buộc đổi nhà cung cấp.
- Cần cấu hình domain, Production/Preview variables, backup/PITR, email, giám sát, giới hạn tài nguyên và quy trình hỗ trợ khách hàng.
- Không cần biến thành plugin để chạy SaaS. Khách hàng dùng cùng dịch vụ web; PWA là cách cài lên điện thoại. Plugin chỉ phù hợp khi tích hợp thêm vào một nền tảng khác.
- Có thể chuyển dữ liệu hiện tại vào tenant CENCOM trong cùng hệ thống khi tenant model đã được kiểm chứng; không nên đưa database đơn tenant đang dùng chung cho khách mới.

## Quyết định mặc định cho CENCOM

Ưu tiên SaaS tập trung nhiều tenant, mời Admin đầu tiên theo từng công ty, license gắn với tenant và được quản lý server-side. Giữ license self-hosted ký số như nhánh sản phẩm tương lai. Chưa tạo hay phát hành key cho người mua trước khi hoàn tất tenant isolation.
