# Chìa khóa lạnh CENCOM

Chìa khóa lạnh là quy trình khôi phục chủ sở hữu khi mọi tài khoản Admin ứng dụng đều mất quyền truy cập. Đây không phải mật khẩu chung và không có giá trị nếu thiếu cả tài khoản Google đã xác minh lẫn quyền Vercel của môi trường tương ứng.

## Quy trình

1. Mở `/cold-key-recovery` trên đúng môi trường CENCOM và đăng nhập bằng Google của chủ sở hữu. Email Google phải được xác minh và liên kết với tài khoản CENCOM.
2. Tạo thử thách. Thử thách hiển thị công khai, chỉ gắn với phiên người dùng hiện tại, dùng một lần, hết hạn sau 5 phút, khóa sau 5 lần nhập sai và giới hạn tạo 3 thử thách mỗi giờ.
3. Trên máy tính tin cậy đã liên kết đúng Vercel project, chọn cùng môi trường trong màn hình và chạy lệnh PowerShell hiển thị ở đó. Với Preview của nhánh `codex/google-auth-preview`, lệnh chỉ lấy biến Preview của đúng nhánh. Với Production, lệnh chỉ lấy biến Production.
4. Lệnh dùng `BETTER_AUTH_SECRET` trong bộ nhớ để tạo mã 10 chữ số cho thử thách. Không ghi secret ra màn hình, file, Git, ảnh chụp hoặc chat. Nhập mã ngắn hạn vào app.
5. CENCOM nâng chính tài khoản Google hiện tại thành Admin, bật trạng thái hoạt động, ghi `COLD_KEY_ADMIN_RECOVERY` vào audit và thu hồi mọi phiên đăng nhập của tài khoản. Chủ sở hữu đăng nhập lại sau đó.

## Giới hạn và vận hành

- Người thực hiện phải còn quyền truy cập Google của chủ sở hữu và tài khoản Vercel có thể đọc biến môi trường cần thiết. Nếu mất quyền Google, khôi phục Google trước; nếu mất Vercel, liên hệ chủ sở hữu team Vercel để khôi phục quyền.
- Chỉ chạy lệnh trên máy tính tin cậy. Không chuyển mã 10 chữ số cho người khác; nó chỉ dùng được cho thử thách đang mở và tồn tại tối đa 5 phút.
- Đây là cơ chế cứu hộ cho bản CENCOM đơn tenant hiện tại. Trước khi chuyển thành SaaS nhiều công ty, phải tách quyền `platform owner` khỏi Admin từng công ty và ràng buộc mọi thao tác khôi phục vào tenant cụ thể.
- Không có route nào cho phép chỉ nhập mã để vượt qua đăng nhập Google. Cơ chế không hoạt động nếu `BETTER_AUTH_SECRET` của môi trường không được Vercel cấp cho máy tính tạo mã và ứng dụng.

## Thử nghiệm

Chỉ thử trên Preview trước. Dùng một tài khoản Google thử nghiệm riêng, không nâng quyền tài khoản vận hành đang dùng. Production chưa được migration hoặc cấu hình/chạy chìa khóa lạnh cho tới khi có phê duyệt release riêng.
