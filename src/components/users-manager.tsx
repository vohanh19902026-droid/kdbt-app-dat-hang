"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, UserPlus } from "lucide-react";
import { roleLabels, type AppRole } from "@/lib/types";

type UserRow = { id: string; name: string; email: string; appRole: AppRole; isActive: boolean; createdAt: string; employeeCode: string | null; phone: string | null; department: string | null; monthlyTargetM3: string | null };
const roles: AppRole[] = ["ADMIN", "PLANNER", "SALES", "ACCOUNTANT"];

export function UsersManager({ users, currentUserId }: { users: UserRow[]; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState<UserRow | null>(null);
  const [resetError, setResetError] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Không tạo được tài khoản."); return; }
      setOpen(false); router.refresh();
    } catch {
      setError("Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setBusy(false);
    }
  }
  async function update(id: string, patch: Record<string, unknown>) {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: id, ...patch }),
      });
      if (!response.ok) { const result = await response.json(); setError(result.error || "Không lưu được thay đổi."); }
      else router.refresh();
    } catch {
      setError("Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    }
  }
  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!resetTarget) return;
    setResetBusy(true); setResetError("");
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      setResetError("Mật khẩu nhập lại không khớp."); setResetBusy(false); return;
    }
    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: resetTarget.id, newPassword }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setResetError(result.error || "Không thể đặt lại mật khẩu."); return; }
      setResetTarget(null); router.refresh();
    } catch {
      setResetError("Mất kết nối tới máy chủ. Vui lòng kiểm tra mạng và thử lại.");
    } finally {
      setResetBusy(false);
    }
  }
  return <>
    <div className="pagehead"><div><div className="eyebrow">QUẢN TRỊ HỆ THỐNG</div><h1>Tài khoản & phân quyền</h1><div className="sub">Cấp tài khoản cho nhân viên và gán vai trò nghiệp vụ.</div></div>
      <button className="btn" onClick={() => setOpen(true)}><UserPlus size={16} /> Tạo tài khoản</button>
    </div>
    <div className="stats">{roles.slice(0, 3).map((role) => <div className="stat" key={role}><div className="stathead">{roleLabels[role]}</div><strong>{users.filter((user) => user.appRole === role && user.isActive).length}</strong><small>Tài khoản đang hoạt động</small></div>)}</div>
    {error && <div className="notice" role="alert">{error}</div>}
    <div className="tablewrap"><table className="grid"><thead><tr><th>NHÂN VIÊN</th><th>EMAIL / TÀI KHOẢN</th><th>VAI TRÒ</th><th>MÃ NV</th><th>SỐ ĐIỆN THOẠI</th><th>BỘ PHẬN</th><th>MỤC TIÊU M³/THÁNG</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th><th>TRUY CẬP</th></tr></thead>
      <tbody>{users.map((user) => <tr key={user.id}><td><b>{user.name}</b></td><td>{user.email}</td><td><select className="pill" value={user.appRole} onChange={(event) => update(user.id, { appRole: event.target.value })}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></td>
        <td><input className="profile-input" aria-label={`Mã nhân viên ${user.name}`} defaultValue={user.employeeCode ?? ""} placeholder="—" onBlur={(event) => update(user.id, { employeeCode: event.target.value.trim() || null })} /></td>
        <td><input className="profile-input" aria-label={`Điện thoại ${user.name}`} defaultValue={user.phone ?? ""} placeholder="—" onBlur={(event) => update(user.id, { phone: event.target.value.trim() || null })} /></td>
        <td><input className="profile-input" aria-label={`Bộ phận ${user.name}`} defaultValue={user.department ?? ""} placeholder="—" onBlur={(event) => update(user.id, { department: event.target.value.trim() || null })} /></td>
        <td><input className="profile-input numeric" aria-label={`Mục tiêu sản lượng ${user.name}`} type="number" min="0" step="0.5" defaultValue={user.monthlyTargetM3 ?? ""} placeholder="—" onBlur={(event) => update(user.id, { monthlyTargetM3: event.target.value ? Number(event.target.value) : null })} /></td>
        <td><select className="pill" value={user.isActive ? "yes" : "no"} onChange={(event) => update(user.id, { isActive: event.target.value === "yes" })}><option value="yes">Đang hoạt động</option><option value="no">Đã khóa</option></select></td>
        <td>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short" }).format(new Date(user.createdAt))}</td>
        <td>{user.id === currentUserId ? <span className="muted">Tự đổi trong menu</span> : <button type="button" className="btn secondary" onClick={() => { setResetTarget(user); setResetError(""); }}><KeyRound size={14} /> Đặt lại mật khẩu</button>}</td></tr>)}</tbody></table>
      {users.length === 0 && <div className="empty">Chưa có tài khoản. Tạo Admin đầu tiên theo hướng dẫn trong README.</div>}
    </div>
    {open && <div className="overlay"><section className="modal" role="dialog" aria-modal="true"><div className="modalhead"><div><div className="eyebrow">TÀI KHOẢN NHÂN VIÊN</div><h2>Tạo người dùng</h2><div className="sub">Tài khoản có thể đăng nhập ngay sau khi tạo.</div></div><button className="close" onClick={() => setOpen(false)} aria-label="Đóng">×</button></div>
      <form onSubmit={create}><div className="formgrid"><div className="field"><label>Họ tên *</label><input name="name" minLength={2} maxLength={100} required /></div>
        <div className="field"><label>Email đăng nhập *</label><input name="email" type="email" required /></div>
        <div className="field"><label>Mật khẩu tạm *</label><input name="password" type="password" minLength={10} required /><small className="muted">Tối thiểu 10 ký tự. Gửi riêng cho nhân viên và hướng dẫn họ đổi sau khi đăng nhập.</small></div>
        <div className="field"><label>Vai trò *</label><select name="appRole" defaultValue="SALES">{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></div>
        <div className="field"><label>Mã nhân viên</label><input name="employeeCode" maxLength={40} /></div>
        <div className="field"><label>Số điện thoại</label><input name="phone" type="tel" maxLength={30} /></div>
        <div className="field"><label>Bộ phận</label><input name="department" maxLength={80} /></div>
        <div className="field"><label>Mục tiêu sản lượng tháng (m³)</label><input name="monthlyTargetM3" type="number" min="0" step="0.5" /></div>
      </div>{error && <div className="form-error">{error}</div>}
        <div className="modalfoot"><button type="button" className="btn secondary" onClick={() => setOpen(false)}>Hủy</button><button className="btn" disabled={busy}>{busy ? "Đang tạo..." : "Tạo tài khoản"}</button></div>
      </form></section></div>}
    {resetTarget && <div className="overlay"><section className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-password-title"><div className="modalhead"><div><div className="eyebrow">KHÔI PHỤC TRUY CẬP</div><h2 id="reset-password-title">Đặt lại mật khẩu</h2><div className="sub">{resetTarget.name} · {resetTarget.email}. Các phiên đăng nhập hiện tại sẽ bị thu hồi.</div></div><button className="close" onClick={() => setResetTarget(null)} aria-label="Đóng">×</button></div>
      <form onSubmit={resetPassword}><div className="formgrid"><div className="field"><label>Mật khẩu tạm mới *</label><input name="newPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /><small className="muted">Tối thiểu 10 ký tự. Gửi riêng cho nhân viên.</small></div><div className="field"><label>Nhập lại mật khẩu *</label><input name="confirmPassword" type="password" autoComplete="new-password" minLength={10} maxLength={128} required /></div></div>
        {resetError && <div className="form-error" role="alert">{resetError}</div>}<div className="modalfoot"><button type="button" className="btn secondary" onClick={() => setResetTarget(null)}>Hủy</button><button className="btn" disabled={resetBusy}>{resetBusy ? "Đang đặt lại…" : "Đặt lại mật khẩu"}</button></div></form></section></div>}
  </>;
}
