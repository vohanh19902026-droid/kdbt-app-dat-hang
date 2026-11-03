# Quy trình phát hành

- `main` là bản Production; `develop` tạo deployment Preview để kiểm tra, không promote Preview thành Production.
- Khi Neon Preview Branching được bật và build chạy trong `VERCEL_ENV=preview`, `npm run vercel-build` áp migration còn thiếu bằng `DATABASE_URL` của nhánh Preview rồi mới build. Nếu thiếu URL, build dừng để tránh một preview không thể dùng.
- Build Production chỉ chạy Next.js build. Trước khi đưa thay đổi schema lên `main`, người vận hành áp migration bằng `npm run db:migrate` với kết nối Production đã được xác nhận; không chạy migration từ nhánh `develop` trên cơ sở dữ liệu Production.
- `BETTER_AUTH_SECRET` Preview là một secret riêng, không dùng chung với Production.
- Mỗi thay đổi nghiệp vụ cần kiểm tra local UAT, lint, typecheck, unit test và production build trước khi merge.
