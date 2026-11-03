# Quy trình phát hành

- `main` là bản Production; `develop` tạo deployment Preview để kiểm tra, không promote Preview thành Production.
- Mọi push/PR lên `main` hoặc `develop` chạy GitHub Actions: cài dependency bằng lockfile, typecheck, lint, unit tests và production build. Vercel Git Integration tự triển khai `develop` thành Preview và `main` thành Production.
- Chỉ merge commit đã qua CI; release dùng merge commit trên `main`, giữ nguyên `develop` cho công việc tiếp theo. Không force-push các nhánh dùng chung. Tạo nhánh `feature/*` từ `develop`; nếu cần làm song song, dùng `git worktree` riêng cho mỗi nhánh và dọn worktree sau khi merge.
- Giữ `package-lock.json` đồng bộ; tăng `package.json` theo Semantic Versioning khi phát hành mốc tính năng/bản vá. Tạo tag `vMAJOR.MINOR.PATCH` cho bản phát hành đã xác nhận.
- Khi Neon Preview Branching được bật và build chạy trong `VERCEL_ENV=preview`, `npm run vercel-build` áp migration còn thiếu bằng `DATABASE_URL` của nhánh Preview rồi mới build. Nếu thiếu URL, build dừng để tránh một preview không thể dùng.
- Preview phải có `DATABASE_URL` riêng trỏ Neon branch thử nghiệm. Không sao chép URL Production vào Preview. Nếu chưa cấu hình nhánh riêng, CI GitHub vẫn kiểm tra code nhưng Vercel Preview sẽ dừng có chủ đích.
- Build Production chỉ chạy Next.js build. Trước khi đưa thay đổi schema lên `main`, người vận hành áp migration bằng `npm run db:migrate` với kết nối Production đã được xác nhận; không chạy migration từ nhánh `develop` trên cơ sở dữ liệu Production.
- Trước khi áp Production, chạy `npm run db:migrate:dry` để xem đúng database đích và các migration còn chờ; sau khi áp, kiểm tra `/api/health`, nhật ký deployment và một luồng nghiệp vụ không tạo dữ liệu giả.
- `BETTER_AUTH_SECRET` Preview là một secret riêng, không dùng chung với Production.
- Mỗi thay đổi nghiệp vụ cần kiểm tra local UAT, lint, typecheck, unit test và production build trước khi merge.
- Duy trì `main` như điểm rollback qua deployment Ready gần nhất; nếu release lỗi, rollback Vercel trước, không tự ý sửa/xóa dữ liệu để “khớp” code. Database migrations phải theo hướng tương thích ngược và additive; migration destructive cần kế hoạch backup/restore riêng.

## Hạ tầng hiện tại và các lựa chọn

- PostgreSQL/Neon là nguồn dữ liệu chuẩn. Chưa cần Redis: hiện không có hàng đợi, cache chia sẻ hoặc trạng thái realtime cần Redis. Bộ giới hạn đăng nhập còn lưu trong RAM từng Vercel instance nên chỉ phù hợp lưu lượng nhỏ; trước khi mở SaaS hoặc tăng tải cần thay bằng rate limit dùng chung và đo tải thực tế.
- GitHub Actions chạy quality gate; Vercel Git Integration lo Preview/Production deployment. Không thêm một pipeline deploy thứ hai để tránh hai lần build/đẩy song song.
- `npm run db:migrate:dry` chỉ kết nối đọc trạng thái migration để in danh sách dự kiến; không thay đổi schema.
