# CONTEXT — Morning Brief (reset MỖI phiên)

> Giới hạn: 40 dòng. Trạng thái HIỆN TẠI; lịch sử dài hạn ở `MEMORY.md`.

## Phiên: 2026-11-02

- Việc đang làm: P0/P1 trước deploy — dựng PostgreSQL test riêng, chạy E2E thật trên bản production, sửa lỗi chặn deploy.
- Nhánh / module đụng tới: `main`; `src/components/orders-workspace.tsx`, `src/app/api/health/route.ts`, `src/app/api/orders/[id]/events/route.ts`, `(workspace)/error.tsx`, `(workspace)/loading.tsx`, `globals.css`.
- Phát hiện quan trọng: `/orders` từng trả 500 ở SSR vì `tabulator-tables` chạm `document` ngay khi nạp module. Đã chuyển sang `await import("tabulator-tables")` trong `useEffect`.
- Phát hiện phụ: Better Auth từ chối `sign-in/email` khi thiếu header `Origin` (`MISSING_OR_NULL_ORIGIN`, HTTP 403); có rate limit 429 khi thử nhiều lần.
- Đã làm: cluster test `initdb` port 55432 (DB `cencom_test`), áp 2 migration, tạo Admin + Sales test (mật khẩu ngoài repo), seed 12 booking; E2E HTTP 37/37 + P1 14/14 PASS; thêm health check, error/loading boundary, API + modal lịch sử `order_events`.
- Chặn deploy: project Vercel `cencom-os/kdbt-app-dat-hang` đã link nhưng **chưa có biến môi trường nào**; máy chưa có `DATABASE_URL` Neon. Cần Chủ tịch cấp chuỗi Neon (hoặc API key Neon) để chạy migration + tạo Admin + `vercel --prod`.
- Rủi ro đang theo dõi: pool `pg` max 5 trên serverless khi đông người dùng; preview deployment khác domain sẽ bị chặn sign-in do `trustedOrigins`.

## BẰNG CHỨNG (lệnh thật đã chạy)

2026-11-02
$ npx tsx scripts/.tmp-e2e.ts (bản production, DB test)
exit code: 0 — 37 passed, 0 failed

2026-11-02
$ npx tsx scripts/.tmp-e2e2.ts (health + lịch sử)
exit code: 0 — 14 passed, 0 failed

2026-11-02
$ npm run typecheck && npm run lint
exit code: 0

2026-11-02
$ npm test
exit code: 0 — 23 test PASS

2026-11-02
$ npm test (sau khi thêm báo cáo khoảng ngày)
exit code: 0 — 25 test PASS

2026-11-02
$ npx tsx scripts/.tmp-e2e3.ts (báo cáo khoảng ngày)
exit code: 0 — 10 passed, 0 failed

2026-11-02
$ npm run build
exit code: 0 — Next.js 16.4.3, 14 route

2026-11-02
$ GET /api/health
HTTP 200 — {"status":"ok","database":"up","latencyMs":23}
