"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Check, Palette, Shield, Users, Wallet } from "lucide-react";
import { UsersManager } from "@/components/users-manager";
import type { AppSettings } from "@/lib/app-settings";
import type { AppRole } from "@/lib/types";

type AdminUser = { id: string; name: string; email: string; appRole: AppRole; isActive: boolean; createdAt: string; employeeCode: string | null; phone: string | null; department: string | null; monthlyTargetM3: string | null };
type SalesVolume = { salesRepName: string; bookedM3: string };
type FinanceSummary = { bookedThisMonthM3: string; chargesThisMonthVnd: string; outstandingVnd: string };
type Section = "appearance" | "company" | "accounts" | "business" | "roadmap";

const sectionInfo: { id: Section; label: string; icon: typeof Palette }[] = [
  { id: "appearance", label: "Giao diện", icon: Palette },
  { id: "company", label: "Doanh nghiệp", icon: Building2 },
  { id: "accounts", label: "Tài khoản & nhân sự", icon: Users },
  { id: "business", label: "Kinh doanh & công nợ", icon: Wallet },
  { id: "roadmap", label: "Khác", icon: Shield },
];

const colors = [
  { id: "green", label: "Xanh lá", color: "#23694e" }, { id: "blue", label: "Xanh dương", color: "#2f68ae" },
  { id: "purple", label: "Tím", color: "#7147a6" }, { id: "red", label: "Đỏ", color: "#a44747" }, { id: "amber", label: "Vàng cam", color: "#b9872c" },
] as const;

const money = (value: string) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(value || 0));
const volume = (value: string) => `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(Number(value || 0))} m³`;

export function AdminSettings({ initialSettings, users, salesVolumes, financeSummary, monthLabel, currentUserId }: { initialSettings: AppSettings; users: AdminUser[]; salesVolumes: SalesVolume[]; financeSummary: FinanceSummary; monthLabel: string; currentUserId: string }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>("appearance");
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function update<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setMessage(""); setError("");
  }
  async function save() {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Không lưu được cấu hình."); return; }
      setMessage("Đã lưu cài đặt và áp dụng cho toàn bộ người dùng.");
      router.refresh();
    } catch { setError("Mất kết nối tới máy chủ. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }

  return <>
    <div className="pagehead"><div><div className="eyebrow">QUẢN TRỊ KHÔNG GIAN</div><h1>Cài đặt</h1><div className="sub">Tùy chỉnh thương hiệu, giao diện và hồ sơ vận hành mà không cần sửa mã nguồn.</div></div>
      {section !== "accounts" && section !== "business" && section !== "roadmap" && <button className="btn" onClick={save} disabled={busy}><Check size={16} />{busy ? "Đang lưu…" : "Lưu cài đặt"}</button>}
    </div>
    <div className="settings-tabs" role="tablist" aria-label="Nhóm cài đặt">{sectionInfo.map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={section === id} className={section === id ? "selected" : ""} onClick={() => { setSection(id); setError(""); setMessage(""); }}><Icon size={16} />{label}</button>)}</div>
    {error && <div className="notice settings-notice error" role="alert">{error}</div>}{message && <div className="notice settings-notice" role="status">{message}</div>}

    {section === "appearance" && <div className="settings-grid">
      <section className="settings-card"><div className="settings-card-head"><div><h2>Giao diện chung</h2><p>Thiết lập được áp dụng cho mọi nhân viên khi tải lại trang.</p></div></div>
        <div className="settings-form-grid">
          <label className="settings-field"><span>Chế độ màu</span><select value={settings.themeMode} onChange={(event) => update("themeMode", event.target.value as AppSettings["themeMode"])}><option value="light">Sáng</option><option value="dark">Tối</option></select></label>
          <label className="settings-field"><span>Kiểu chữ</span><select value={settings.fontFamily} onChange={(event) => update("fontFamily", event.target.value as AppSettings["fontFamily"])}><option value="dm-sans">DM Sans</option><option value="manrope">Manrope</option><option value="system">Mặc định thiết bị</option></select></label>
          <label className="settings-field full"><span>Cỡ chữ <b>{settings.fontScale}%</b></span><input type="range" min="85" max="125" step="5" value={settings.fontScale} onChange={(event) => update("fontScale", Number(event.target.value))} /><small>Áp dụng tỷ lệ từ 85% đến 125% cho phần lớn văn bản và bảng.</small></label>
        </div>
        <div className="settings-field color-field"><span>Màu nhận diện</span><div className="color-options">{colors.map(({ id, label, color }) => <button key={id} type="button" className={settings.accentColor === id ? "chosen" : ""} onClick={() => update("accentColor", id)} aria-pressed={settings.accentColor === id}><i style={{ background: color }} />{label}</button>)}</div></div>
      </section>
      <section className="settings-card preview-card"><div className="settings-card-head"><div><h2>Xem trước</h2><p>Thử nhanh kiểu chữ, cỡ chữ và màu nhận diện.</p></div></div>
        <div className={`settings-preview ${settings.themeMode === "dark" ? "theme-dark" : ""}`} style={{ "--preview-accent": colors.find((item) => item.id === settings.accentColor)?.color, fontSize: `${settings.fontScale}%`, fontFamily: settings.fontFamily === "system" ? "system-ui" : settings.fontFamily === "manrope" ? "Manrope" : "'DM Sans'" } as React.CSSProperties}>
          <small>{settings.companyName}</small><strong>Lệnh bê tông mới</strong><span>BOOK-7445 · 12 m³</span><button>Xác nhận đơn</button>
        </div>
      </section>
    </div>}

    {section === "company" && <div className="settings-card"><div className="settings-card-head"><div><h2>Hồ sơ doanh nghiệp</h2><p>Thông tin hiển thị trên thanh điều hướng và dùng làm hồ sơ workspace.</p></div><button className="btn" onClick={save} disabled={busy}>{busy ? "Đang lưu…" : "Lưu thông tin"}</button></div>
      <div className="settings-form-grid">
        <label className="settings-field"><span>Tên doanh nghiệp *</span><input maxLength={80} value={settings.companyName} onChange={(event) => update("companyName", event.target.value)} /></label>
        <label className="settings-field"><span>Dòng mô tả</span><input maxLength={100} value={settings.companySubtitle} onChange={(event) => update("companySubtitle", event.target.value)} /></label>
        <label className="settings-field"><span>Điện thoại</span><input type="tel" maxLength={30} value={settings.companyPhone} onChange={(event) => update("companyPhone", event.target.value)} /></label>
        <label className="settings-field"><span>Email</span><input type="email" maxLength={254} value={settings.companyEmail} onChange={(event) => update("companyEmail", event.target.value)} /></label>
        <label className="settings-field full"><span>Địa chỉ</span><input maxLength={200} value={settings.companyAddress} onChange={(event) => update("companyAddress", event.target.value)} /></label>
      </div>
      <div className="settings-note">Logo tải lên và nhiều chi nhánh có thể bổ sung sau khi thống nhất định dạng nhận diện và mô hình tenant.</div>
    </div>}

    {section === "accounts" && <><div className="settings-section-intro"><div><h2>Nhân sự và phân quyền</h2><p>Tạo tài khoản, khóa/mở truy cập, phân vai trò và cập nhật hồ sơ nhân viên.</p></div></div><UsersManager users={users} currentUserId={currentUserId} /></>}

    {section === "business" && <>
      <div className="settings-section-intro"><div><h2>Tổng quan kinh doanh</h2><p>Số liệu thực tế từ lệnh đặt và sổ công nợ, kỳ {monthLabel}.</p></div><a className="btn secondary" href="/accounting">Mở sổ công nợ</a></div>
      <div className="stats settings-stats"><div className="stat"><div className="stathead">Khối lượng đặt trong tháng</div><strong>{volume(financeSummary.bookedThisMonthM3)}</strong><small>Tổng m³ trên các lệnh theo giờ yêu cầu</small></div><div className="stat"><div className="stathead">Phát sinh doanh thu ghi sổ</div><strong>{money(financeSummary.chargesThisMonthVnd)}</strong><small>Các khoản ghi nợ trong kỳ</small></div><div className="stat"><div className="stathead">Công nợ còn lại</div><strong>{money(financeSummary.outstandingVnd)}</strong><small>Số dư toàn bộ khách hàng</small></div></div>
      <section className="settings-card"><div className="settings-card-head"><div><h2>Hồ sơ nhân viên kinh doanh</h2><p>Chỉ bao gồm tài khoản NV kinh doanh đang hoạt động; mục tiêu và thông tin liên hệ được chỉnh trong tab nhân sự.</p></div><button className="btn secondary" onClick={() => setSection("accounts")}>Chỉnh hồ sơ</button></div>
        <div className="tablewrap"><table className="grid sales-performance"><thead><tr><th>NHÂN VIÊN</th><th>MÃ NV</th><th>ĐIỆN THOẠI</th><th>BỘ PHẬN</th><th>KHỐI LƯỢNG ĐẶT THÁNG</th><th>MỤC TIÊU</th><th>TIẾN ĐỘ</th></tr></thead><tbody>{users.filter((u) => u.appRole === "SALES" && u.isActive).map((u) => { const booked = Number(salesVolumes.find((v) => v.salesRepName === u.name)?.bookedM3 ?? 0); const target = Number(u.monthlyTargetM3 ?? 0); return <tr key={u.id}><td><b>{u.name}</b><small>{u.email}</small></td><td>{u.employeeCode || "—"}</td><td>{u.phone || "—"}</td><td>{u.department || "Kinh doanh"}</td><td>{volume(String(booked))}</td><td>{target ? volume(String(target)) : "Chưa đặt"}</td><td>{target ? `${Math.min(100, Math.round(booked / target * 100))}%` : "—"}</td></tr>; })}</tbody></table></div>
        {users.every((u) => u.appRole !== "SALES" || !u.isActive) && <div className="empty">Chưa có tài khoản kinh doanh đang hoạt động.</div>}
      </section>
      <div className="settings-note">Công nợ được theo dõi theo khách hàng. Trong sổ Công nợ, Admin/Kế toán có thể phân công NVKD phụ trách và lọc, xuất XLSX theo người phụ trách hiện tại.</div>
    </>}

    {section === "roadmap" && <div className="settings-card"><div className="settings-card-head"><div><h2>Các nhóm cài đặt nên bổ sung tiếp</h2><p>Mẫu SaaS thường tách quyền truy cập theo vai trò và gom phần tùy biến workspace vào một trung tâm quản trị.[1][2]</p></div></div>
      <div className="settings-roadmap"><article><b>Danh mục nghiệp vụ</b><p>Mác bê tông, cát/đá, loại bơm, phương tiện, dung tích xe, cách tính ca và trạng thái đơn.</p><span>Ưu tiên kế tiếp · cần gắn các danh mục vào biểu mẫu và bảng kế hoạch</span></article><article><b>Thông báo</b><p>Thông báo đơn mới, thay đổi lịch, nhắc xác nhận và cấu hình email/web push.</p><span>Ưu tiên kế tiếp · hiện chưa kết nối nhà cung cấp gửi tin</span></article><article><b>Bảo mật và nhật ký</b><p>Chính sách mật khẩu, phiên đăng nhập, nhật ký thao tác Admin, xuất danh sách và lưu trữ dữ liệu.</p><span>Ưu tiên cao trước khi mở SaaS cho nhiều doanh nghiệp</span></article><article><b>Gói dịch vụ và tích hợp</b><p>Giới hạn người dùng, chi nhánh, dung lượng và kết nối kế toán/hóa đơn.</p><span>Để sau khi chuyển sang kiến trúc nhiều doanh nghiệp</span></article></div>
      <div className="settings-note">Gợi ý dựa trên mục quản trị workspace, hồ sơ người dùng và phân quyền có trong tài liệu hỗ trợ chính thức của Slack và Shopify: <a href="https://slack.com/help/articles/217626298-Getting-started-for-workspace-creators" target="_blank" rel="noreferrer">Slack</a> · <a href="https://help.shopify.com/en/manual/your-account/users/manage-users" target="_blank" rel="noreferrer">Shopify</a>.</div>
    </div>}
  </>;
}
