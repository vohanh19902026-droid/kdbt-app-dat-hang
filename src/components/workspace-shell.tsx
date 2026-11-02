"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartColumn, ClipboardList, KeyRound, LayoutDashboard, LogOut, Settings2, Users, Wallet } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { roleLabels, type AppRole } from "@/lib/types";
import type { AppSettings } from "@/lib/app-settings";

const accentTokens = {
  green: { green: "#174b3b", green2: "#23694e", mint: "#e6f1e9", orange: "#f0a44c" },
  blue: { green: "#1e477b", green2: "#2f68ae", mint: "#e6effb", orange: "#f2b24a" },
  purple: { green: "#523080", green2: "#7147a6", mint: "#f0eafa", orange: "#e8aa55" },
  red: { green: "#773333", green2: "#a44747", mint: "#faeaea", orange: "#e8ae56" },
  amber: { green: "#705018", green2: "#997025", mint: "#f8f0d9", orange: "#e8a143" },
} as const;

export function WorkspaceShell({ children, userName, email, role, settings }: { children: React.ReactNode; userName: string; email: string; role: AppRole; settings: AppSettings }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const accent = accentTokens[settings.accentColor] || accentTokens.green;
  const themeStyle = {
    "--green": accent.green, "--green2": accent.green2, "--mint": accent.mint, "--orange": accent.orange,
    "--font-scale": String(settings.fontScale / 100),
    fontFamily: settings.fontFamily === "system" ? "system-ui, sans-serif" : settings.fontFamily === "manrope" ? "Manrope, sans-serif" : "'DM Sans', sans-serif",
  } as React.CSSProperties;
  const nav = [
    { href: "/orders", label: "Đơn đặt bê tông", icon: ClipboardList, show: role !== "ACCOUNTANT" },
    { href: "/planning", label: "Bảng kế hoạch", icon: LayoutDashboard, show: ["ADMIN", "PLANNER"].includes(role) },
    { href: "/reports", label: "Tổng hợp sản lượng", icon: ChartColumn, show: role !== "SALES" },
    { href: "/customers", label: "Khách hàng", icon: Users, show: ["ADMIN", "PLANNER"].includes(role) },
    { href: "/admin/users", label: "Tài khoản & phân quyền", icon: Settings2, show: role === "ADMIN" },
    { href: "/admin/settings", label: "Cài đặt", icon: Settings2, show: role === "ADMIN" },
    { href: "/accounting", label: "Công nợ", icon: Wallet, show: role === "ADMIN" || role === "ACCOUNTANT" },
  ].filter((item) => item.show);
  async function signOut() { await authClient.signOut(); router.replace("/login"); router.refresh(); }
  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordBusy(true); setPasswordError(""); setPasswordNotice("");
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get("currentPassword") ?? "");
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (newPassword.length < 10) { setPasswordError("Mật khẩu mới phải có ít nhất 10 ký tự."); setPasswordBusy(false); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Mật khẩu nhập lại không khớp."); setPasswordBusy(false); return; }
    if (newPassword === currentPassword) { setPasswordError("Mật khẩu mới phải khác mật khẩu hiện tại."); setPasswordBusy(false); return; }
    try {
      const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
      if (result.error) {
        setPasswordError(result.error.message || "Không đổi được mật khẩu. Kiểm tra mật khẩu hiện tại.");
        return;
      }
      setPasswordNotice("Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.");
      event.currentTarget.reset();
    } catch {
      setPasswordError("Mất kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setPasswordBusy(false);
    }
  }
  const mobileNav = role === "ADMIN" ? ["/orders", "/planning", "/accounting", "/admin/settings"] : nav.slice(0, 4).map((item) => item.href);
  return <div className={`shell ${settings.themeMode === "dark" ? "theme-dark" : ""}`} style={themeStyle} data-theme={settings.themeMode}>
    <aside className="sidebar">
      <div className="brand"><div className="brandmark">{settings.companyName.slice(0, 1).toUpperCase()}</div><div className="brandname">{settings.companyName}<small>{settings.companySubtitle}</small></div></div>
      <div className="navlabel">Không gian làm việc</div>
      <nav className="nav">{nav.map((item) => <Link key={item.href} className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""} href={item.href}><item.icon className="ico" size={17} />{item.label}</Link>)}</nav>
      <div className="sidebottom"><div className="avatar">{userName.slice(0, 1).toLocaleUpperCase("vi-VN")}</div><div className="user-copy"><b>{userName}</b><small>{roleLabels[role]}</small><span>{email}</span><button className="nav" onClick={() => { setShowPassword(true); setPasswordError(""); setPasswordNotice(""); }}><KeyRound size={15} /> Đổi mật khẩu</button><button className="nav logout" onClick={signOut}><LogOut size={15} /> Đăng xuất</button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">{settings.companyName} <span style={{ color: "#adb6ae" }}> / </span><strong>{nav.find((item) => item.href === pathname)?.label || "Điều hành"}</strong></div>
        <div className="top-actions"><div className="role-select">{roleLabels[role]}</div><div className="date-select">{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())}</div></div>
      </header>
      <section className="content">{children}</section>
    </main>
    <nav className="mobile-tabs">{mobileNav.map((href) => { const item = nav.find((entry) => entry.href === href); return item ? <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><item.icon size={18} />{href === "/admin/settings" ? "Cài đặt" : item.label.split(" ")[0]}</Link> : null; })}</nav>
    {showPassword && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowPassword(false); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="password-title">
        <div className="modalhead">
          <div><div className="eyebrow">BẢO MẬT TÀI KHOẢN</div><h2 id="password-title">Đổi mật khẩu</h2><div className="sub">Sau khi đổi, các thiết bị khác sẽ bị đăng xuất.</div></div>
          <button className="close" onClick={() => setShowPassword(false)} aria-label="Đóng">×</button>
        </div>
        <form onSubmit={changePassword}>
          <div className="formgrid">
            <div className="field full"><label htmlFor="currentPassword">Mật khẩu hiện tại *</label><input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required /></div>
            <div className="field"><label htmlFor="newPassword">Mật khẩu mới *</label><input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></div>
            <div className="field"><label htmlFor="confirmPassword">Nhập lại mật khẩu mới *</label><input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></div>
          </div>
          {passwordError && <div className="form-error" role="alert">{passwordError}</div>}
          {passwordNotice && <div className="muted" role="status">{passwordNotice}</div>}
          <div className="modalfoot">
            <button type="button" className="btn secondary" onClick={() => setShowPassword(false)}>Đóng</button>
            <button className="btn" disabled={passwordBusy}>{passwordBusy ? "Đang lưu..." : "Đổi mật khẩu"}</button>
          </div>
        </form>
      </section>
    </div>}
  </div>;
}
