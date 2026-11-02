# CONTEXT — Morning Brief (reset mỗi phiên)

> Trạng thái mới nhất; quyết định dài hạn ở `MEMORY.md`.

## Phiên: 2026-11-02

- Mục tiêu: hoàn thiện MVP đặt hàng/điều phối bê tông và bàn giao để bắt đầu UAT.
- Repo: nhánh `main`, `origin/main` tại `ac0d07b` lúc nhận tệp handoff; workspace có hai script smoke chưa theo dõi: `scripts/smoke-production.ts`, `scripts/cleanup-smoke.ts`.
- Ứng dụng đã deploy trên Vercel; domain đăng nhập: `https://kdbt-app-dat-hang-eu1a50fak-vohanh19902026-droid.vercel.app/login`.
- Nhật ký phiên triển khai ghi nhận Neon được tạo, migration áp dụng, Admin đầu tiên được khởi tạo, health production 200/database up, smoke production 16/16 PASS và dữ liệu smoke đã dọn.
- Local kiểm tra lại: `npm run typecheck`, `npm run lint`, `npm test` (25 PASS), `npm run build` đều exit 0.
- Tệp `.env.local` chứa biến môi trường Neon/Vercel; tuyệt đối không in giá trị, gửi ra chat hoặc commit. Chỉ liệt kê tên khóa khi cần.
- Chưa hoàn tất UAT do nhân viên: Admin cần đăng nhập/đổi mật khẩu, tạo tài khoản NV kế hoạch/NVKD, kiểm thử nghiệp vụ trên thiết bị thật.
- XLSX hiện dựa theo ảnh; chưa có workbook gốc để so khớp chính xác. Công nợ/kế toán, hóa đơn và đối soát là giai đoạn sau.
- Trước đây CUA bị từ chối đọc Vercel bởi policy origin. Không vòng qua bằng CLI/API, CDP thô hoặc trình duyệt khác; nếu còn cần thao tác trang, dùng đúng quyền được cấp và tuân thủ kết quả policy.

## Bằng chứng kiểm tra local (2026-11-02)

- `npm run typecheck` — exit 0.
- `npm run lint` — exit 0.
- `npm test` — 25/25 pass.
- `npm run build` — exit 0, Next.js 16.4.3.
