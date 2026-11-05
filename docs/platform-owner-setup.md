# SUP-ADMIN: chủ sở hữu nền tảng

## Mô hình quyền

- SUP-ADMIN là một tài khoản Google đã xác minh, có vai trò nghiệp vụ `ADMIN` và cờ máy chủ `is_platform_owner` riêng. Không có endpoint công khai nào nhận cờ này từ người dùng.
- Địa chỉ chủ sở hữu ban đầu được cố định trong lệnh bootstrap là `vohanh19902026@gmail.com`. Tự đăng ký Google không thể tự cấp quyền owner.
- Bootstrap chỉ nâng cấp đúng hồ sơ đã đăng nhập Google và xác minh email. Lệnh không tạo mật khẩu, không đọc/ghi mật khẩu, và từ chối nếu đã có chủ sở hữu khác.
- Chỉ SUP-ADMIN được tạo/cấp hoặc thu hồi vai trò ADMIN và đặt lại mật khẩu cho Admin khác. Không tài khoản nào có thể đổi vai trò hoặc khóa tài khoản owner trong giao diện. Owner tự phục hồi bằng Google hoặc email xác minh.
- Ràng buộc partial unique index giới hạn tối đa một owner trong mỗi database.

## Thiết lập Preview

1. Cấu hình và kiểm tra Google OAuth trên Preview, rồi người sở hữu đăng nhập đúng Gmail ở trên. Tài khoản mới ban đầu vẫn ở trạng thái chờ.
2. Áp migration `0012_google_registration_approval.sql` và `0013_platform_owner.sql` lên database Preview cô lập sau khi đối chiếu đúng project/database. Không dùng Neon Production cho bước này.
3. Tại PowerShell cục bộ, tải environment Preview vào `.env.local` bằng công cụ Vercel chính thức. Không in nội dung file hay connection string ra console/chat.
4. Điền biến xác nhận ngay trong terminal:

```powershell
$env:SUP_ADMIN_TARGET_ENV = 'PREVIEW'
$env:SUP_ADMIN_CONFIRM_TARGET_ENV = 'PREVIEW'
$env:SUP_ADMIN_EMAIL = 'vohanh19902026@gmail.com'
$env:SUP_ADMIN_EXPECTED_DATABASE = $env:PREVIEW_DATABASE_NAME
$env:SUP_ADMIN_EXPECTED_NEON_PROJECT_ID = $env:DATABASE_NEON_PROJECT_ID
$env:SUP_ADMIN_EXPECTED_NEON_ENDPOINT_ID = '<endpoint ID đã đối chiếu ở Neon Preview>'
npm run auth:bootstrap-platform-owner
```

Lệnh xác nhận host là endpoint Neon, endpoint ID, tên database trong URL, project ID trùng `PREVIEW_DATABASE_PROJECT_ID`, email đúng allowlist và tài khoản có liên kết Google đã xác minh. Lấy endpoint ID từ host của connection Preview đã đối chiếu trong Neon Console; không dùng connection string của Production. Chạy từ terminal cục bộ; không chạy trong Vercel build hoặc ứng dụng web.

## Tạo Admin đầu tiên

Sau khi owner đăng nhập Preview, nhân viên/Admin cần đăng nhập Google và gửi hồ sơ. Owner duyệt `Vai trò = Quản trị viên` và bật `Đang hoạt động` tại trang tài khoản. Admin thường không thể tự cấp Admin thứ hai. Trước khi cấp Production, gửi link khôi phục mật khẩu qua SMTP đã thử thành công hoặc để Admin tự đăng nhập Google.

## Production

Không chạy bootstrap Production cho tới khi OAuth/SMTP Production, migration dry-run, xác minh backup/restore và quy trình rollback đạt. Lệnh Production bắt buộc `SUP_ADMIN_TARGET_ENV=PRODUCTION`, tên database khớp `PRODUCTION_DATABASE_NAME`, endpoint/project ID khớp giá trị đã đối chiếu, `SUP_ADMIN_PRODUCTION_RELEASE_READY=YES` và có mã tham chiếu bản sao lưu đã kiểm tra. Các biến này chỉ nhập tại terminal quản trị; không commit hoặc gửi vào chat.
