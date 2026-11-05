"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { roleLabels, type AppRole } from "@/lib/types";

const roles: AppRole[] = ["SALES", "PLANNER", "ACCOUNTANT", "TECHNICAL", "ADMIN"];

export function PendingRegistration({ name, email, requestedRole }: { name: string; email: string; requestedRole: AppRole | null }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(requestedRole));

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/onboarding", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Chưa gửi được hồ sơ."); return; }
      setSubmitted(true); router.refresh();
    } catch { setError("Không kết nối được máy chủ. Vui lòng thử lại."); }
    finally { setBusy(false); }
  }

  return <main className="login-bg"><section className="login-card" style={{ maxWidth: 620 }}>
    <div className="login-brand"><div className="brandmark">C</div><div className="brandname">CENCOM<small>ĐIỀU PHỐI BÊ TÔNG</small></div></div>
    <h1>Hoàn tất đăng ký</h1>
    <p className="sub">Đăng nhập Google thành công với <b>{email}</b>. Hãy gửi hồ sơ để Admin xét duyệt quyền truy cập.</p>
    {submitted ? <div className="notice" role="status"><b>Hồ sơ đã được gửi.</b><br />Tài khoản đang chờ Admin duyệt. Bạn chưa thể xem đơn hàng hoặc dữ liệu nội bộ. Hãy đăng nhập lại sau khi được thông báo đã kích hoạt.<br />Vai trò đề nghị: {requestedRole ? roleLabels[requestedRole] : "đã ghi nhận"}.</div> : <form onSubmit={submit}>
      <div className="field"><label htmlFor="name">Họ và tên *</label><input id="name" name="name" defaultValue={name} minLength={2} maxLength={100} required /></div>
      <div className="field"><label htmlFor="age">Tuổi *</label><input id="age" name="age" type="number" min={16} max={100} step={1} required /></div>
      <div className="field"><label htmlFor="department">Bộ phận *</label><input id="department" name="department" maxLength={80} required /></div>
      <div className="field"><label htmlFor="jobTitle">Chức vụ *</label><input id="jobTitle" name="jobTitle" maxLength={80} required /></div>
      <div className="field"><label htmlFor="requestedAppRole">Vai trò cần sử dụng *</label><select id="requestedAppRole" name="requestedAppRole" defaultValue="SALES">{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select><small className="muted">Vai trò chỉ có hiệu lực sau khi Admin phê duyệt.</small></div>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button className="btn" disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 20 }}>{busy ? "Đang gửi…" : "Gửi đăng ký chờ duyệt"}</button>
    </form>}
    <div className="login-footer"><a href="/api/auth/sign-out">Đăng xuất</a></div>
  </section></main>;
}
