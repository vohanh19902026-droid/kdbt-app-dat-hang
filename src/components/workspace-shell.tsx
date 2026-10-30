"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartColumn, ClipboardList, LayoutDashboard, LogOut, Settings2, Users, Wallet } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { roleLabels, type AppRole } from "@/lib/types";

export function WorkspaceShell({ children, userName, email, role }: { children: React.ReactNode; userName: string; email: string; role: AppRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const nav = [
    { href: "/orders", label: "Đơn đặt bê tông", icon: ClipboardList, show: true },
    { href: "/planning", label: "Bảng kế hoạch", icon: LayoutDashboard, show: ["ADMIN", "PLANNER"].includes(role) },
    { href: "/reports", label: "Tổng hợp sản lượng", icon: ChartColumn, show: role !== "SALES" },
    { href: "/customers", label: "Khách hàng", icon: Users, show: ["ADMIN", "PLANNER"].includes(role) },
    { href: "/admin/users", label: "Tài khoản & phân quyền", icon: Settings2, show: role === "ADMIN" },
    { href: "/accounting", label: "Công nợ · sắp có", icon: Wallet, show: role === "ADMIN" || role === "ACCOUNTANT" },
  ].filter((item) => item.show);
  async function signOut() { await authClient.signOut(); router.replace("/login"); router.refresh(); }
  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><div className="brandmark">C</div><div className="brandname">CENCOM<small>ĐIỀU PHỐI BÊ TÔNG</small></div></div>
      <div className="navlabel">Không gian làm việc</div>
      <nav className="nav">{nav.map((item) => <Link key={item.href} className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : ""} href={item.href}><item.icon className="ico" size={17} />{item.label}</Link>)}</nav>
      <div className="sidebottom"><div className="avatar">{userName.slice(0, 1).toLocaleUpperCase("vi-VN")}</div><div className="user-copy"><b>{userName}</b><small>{roleLabels[role]}</small><span>{email}</span><button className="nav logout" onClick={signOut}><LogOut size={15} /> Đăng xuất</button></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb">CENCOM <span style={{ color: "#adb6ae" }}> / </span><strong>{nav.find((item) => item.href === pathname)?.label || "Điều hành"}</strong></div>
        <div className="top-actions"><div className="role-select">{roleLabels[role]}</div><div className="date-select">{new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date())}</div></div>
      </header>
      <section className="content">{children}</section>
    </main>
    <nav className="mobile-tabs">{nav.slice(0, 4).map((item) => <Link key={item.href} className={pathname === item.href ? "active" : ""} href={item.href}><item.icon size={18} />{item.label.split(" ")[0]}</Link>)}</nav>
  </div>;
}