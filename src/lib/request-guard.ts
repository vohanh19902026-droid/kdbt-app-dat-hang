/**
 * Chặn CSRF cho các API ghi dữ liệu dùng cookie session.
 * Trình duyệt luôn gửi Origin cho POST/PATCH cùng origin; nếu Origin có mặt
 * nhưng không khớp host của request thì từ chối. Request không có Origin
 * (CLI/server-to-server) không tự gửi cookie nên vẫn được xử lý bình thường.
 */
export function isCrossOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return true;
  }
  const hosts = [request.headers.get("host"), request.headers.get("x-forwarded-host")]
    .filter((value): value is string => Boolean(value));
  return hosts.length === 0 || !hosts.includes(parsed.host);
}
