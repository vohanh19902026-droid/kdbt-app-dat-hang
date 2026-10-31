# CONTEXT — Morning Brief (reset MỖI phiên)

> Giới hạn: 40 dòng. Trạng thái HIỆN TẠI; lịch sử dài hạn ở `MEMORY.md`.

## Phiên: 2026-10-31

- Việc đang làm: Gia cố luồng kế hoạch trước khi chạy với Neon — dời ngày cấp hàng, chống ghi đè, chặn ngày rác, security headers.
- Nhánh / module đụng tới: `main`; `src/lib/vn-date.ts`, `src/lib/planning-schedule.ts`, `src/lib/request-guard.ts`, API `orders`/`exports`/`admin/users`, lưới Tabulator, `next.config.ts`.
- Phát hiện quan trọng: `.env.local` chỉ có `VERCEL_OIDC_TOKEN`, thiếu `DATABASE_URL`; PostgreSQL local đang chạy nhưng không có mật khẩu để tạo DB test; Docker daemon chưa bật. Chưa thể chạy E2E với DB thật.
- Hôm nay làm gì: thêm validate ngày/giờ, cột NGÀY kế hoạch, export theo ngày cấp hàng, version optimistic locking, origin guard, CSP/security headers, 17 test mới.
- Rủi ro đang phải theo dõi: chưa test E2E (thiếu DATABASE_URL); CSP production chưa mở bằng trình duyệt thật; pool `pg` max 5 trên Vercel serverless cần theo dõi khi đông người dùng.

## BẰNG CHỨNG (lệnh thật đã chạy)

2026-10-31 11:36
$ npm run typecheck
exit code: 0

2026-10-31 11:36
$ npm run lint
exit code: 0

2026-10-31 11:36
$ npm test
exit code: 0 — 23 test PASS, 0 fail

2026-10-31 11:37
$ npm run build
exit code: 0 — Next.js 16.4.3 build production thành công (13 route)

2026-10-31 11:39
$ npx next start -p 3100 (sau npm run build)
exit code: 0 — GET /login HTTP 200; CSP, X-Content-Type-Options: nosniff, X-Frame-Options: DENY đúng
