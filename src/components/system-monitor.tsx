"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity, Database, HardDriveDownload, RefreshCw, UsersRound } from "lucide-react";

type Metrics = {
  range: string; collectedSince: string; pageViews: number; uniqueUsers: number; activeUsersNow: number;
  observedTransferBytes: number; database: { status: string; latencyMs: number; provider: string };
  accounts: { total: number; active: number }; totalOrders: number;
  deployment: string; region: string; runtime: string; appVersion: string;
  byRoute: Array<{ route: string; visits: number; bytes: number }>;
};

const bytesLabel = (bytes: number) => bytes < 1024 * 1024
  ? `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
  : `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(bytes / (1024 * 1024))} MB`;
const routeNames: Record<string, string> = {
  "/orders": "Đơn đặt bê tông", "/receiving": "Nhận đơn hàng", "/planning": "Bảng kế hoạch",
  "/reports": "Tổng hợp sản lượng", "/customers": "Khách hàng", "/accounting": "Công nợ",
  "/admin/settings": "Cài đặt", "/technical/catalog": "Danh mục kỹ thuật", "/notifications": "Tin báo",
};

export function SystemMonitor() {
  const [range, setRange] = useState("24h");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch(`/api/admin/system-metrics?range=${range}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Không tải được số liệu hệ thống.");
      setMetrics(await response.json() as Metrics);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không kết nối được máy chủ."); }
    finally { setLoading(false); }
  }, [range]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <div className="system-monitor">
    <div className="settings-section-intro"><div><h2>Giám sát hệ thống</h2><p>Lưu lượng do ứng dụng ghi nhận, số người dùng và thời gian phản hồi kết nối cơ sở dữ liệu.</p></div>
      <div className="system-tools"><select aria-label="Khoảng thời gian" value={range} onChange={(event) => setRange(event.target.value)}><option value="24h">24 giờ qua</option><option value="7d">7 ngày qua</option><option value="30d">30 ngày qua</option></select><button className="btn secondary" onClick={() => void load()} disabled={loading}><RefreshCw size={15} /> Làm mới</button></div>
    </div>
    {error && <div className="notice settings-notice error" role="alert">{error} Hãy kiểm tra migration `0007_usage_events.sql` đã được áp dụng trên Neon chưa.</div>}
    {loading && !metrics ? <div className="settings-card" aria-live="polite">Đang lấy số liệu hệ thống…</div> : metrics && <>
      <div className="stats settings-stats system-stats">
        <div className="stat"><div className="stathead"><Activity size={15} /> Lượt truy cập màn hình</div><strong>{metrics.pageViews.toLocaleString("vi-VN")}</strong><small>{metrics.uniqueUsers} người dùng khác nhau trong kỳ</small></div>
        <div className="stat"><div className="stathead"><UsersRound size={15} /> Đang hoạt động</div><strong>{metrics.activeUsersNow.toLocaleString("vi-VN")}</strong><small>Người dùng trong 5 phút gần nhất</small></div>
        <div className="stat"><div className="stathead"><HardDriveDownload size={15} /> Dữ liệu trình duyệt nhận</div><strong>{bytesLabel(metrics.observedTransferBytes)}</strong><small>Cộng dồn trong kỳ đã chọn</small></div>
        <div className="stat"><div className="stathead"><Database size={15} /> Phản hồi cơ sở dữ liệu</div><strong>{metrics.database.latencyMs} ms</strong><small>Kiểm tra truy vấn DB trực tiếp · {metrics.database.status === "up" ? "Đang kết nối" : "Mất kết nối"}</small></div>
      </div>
      <div className="settings-grid system-grid">
        <section className="settings-card"><div className="settings-card-head"><div><h2>Lưu lượng theo màn hình</h2><p>Chỉ tính phiên làm việc có đăng nhập và trình duyệt cho phép đo kích thước truyền nhận.</p></div></div>
          {metrics.byRoute.length ? <div className="tablewrap"><table className="grid"><thead><tr><th>MÀN HÌNH</th><th>LƯỢT MỞ</th><th>DỮ LIỆU GHI NHẬN</th></tr></thead><tbody>{metrics.byRoute.map((row) => <tr key={row.route}><td>{routeNames[row.route] ?? row.route}</td><td>{row.visits.toLocaleString("vi-VN")}</td><td>{bytesLabel(row.bytes)}</td></tr>)}</tbody></table></div> : <div className="empty">Chưa có lượt sử dụng được ghi nhận trong khoảng thời gian này.</div>}
        </section>
        <section className="settings-card"><div className="settings-card-head"><div><h2>Thông tin máy chủ</h2><p>Thông tin runtime hiện phục vụ ứng dụng.</p></div></div>
          <dl className="system-details"><div><dt>Database</dt><dd>{metrics.database.status === "up" ? `${metrics.database.provider} · hoạt động` : "Không kết nối"}</dd></div><div><dt>Thời gian truy vấn</dt><dd>{metrics.database.latencyMs} ms</dd></div><div><dt>Môi trường</dt><dd>{metrics.deployment}</dd></div><div><dt>Vùng triển khai</dt><dd>{metrics.region}</dd></div><div><dt>Node.js</dt><dd>{metrics.runtime}</dd></div><div><dt>Bản triển khai</dt><dd>{metrics.appVersion}</dd></div><div><dt>Tài khoản hoạt động</dt><dd>{metrics.accounts.active}/{metrics.accounts.total}</dd></div><div><dt>Tổng đơn hàng</dt><dd>{metrics.totalOrders.toLocaleString("vi-VN")}</dd></div></dl>
        </section>
      </div>
      <div className="settings-note">Số byte là ước lượng từ tài nguyên cùng nguồn mà trình duyệt báo đã tải; cache, trình duyệt và thiết bị có thể làm số liệu thấp hơn thực tế. Đây không phải băng thông CDN/egress chính thức. Xem số liệu chính xác của nền tảng tại <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer">Vercel Dashboard → Usage</a>. Số lượt bắt đầu có sau khi cập nhật ứng dụng và áp dụng migration; không hồi tố dữ liệu cũ.</div>
    </>}
  </div>;
}
