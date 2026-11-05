"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: "/reset-password",
      });
      if (result.error) {
        setError("Chưa gửi được yêu cầu. Vui lòng thử lại sau hoặc liên hệ Admin.");
      } else {
        setNotice("Nếu email thuộc tài khoản CENCOM đang hoạt động, hướng dẫn xác minh và đặt lại mật khẩu sẽ được gửi tới hộp thư đó. Hãy kiểm tra cả mục Spam.");
      }
    } catch {
      setError("Chưa gửi được yêu cầu. Vui lòng thử lại sau hoặc liên hệ Admin.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-bg"><section className="login-card">
    <div className="login-brand"><div className="brandmark">C</div><div className="brandname">CENCOM<small>ĐIỀU PHỐI BÊ TÔNG</small></div></div>
    <h1>Quên mật khẩu?</h1><p className="sub">Nhập email gắn với tài khoản. Chúng tôi sẽ gửi liên kết xác minh để đặt mật khẩu mới.</p>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="email">Email tài khoản</label><input id="email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ten@congty.vn" /></div>
      {error && <p className="login-error" role="alert">{error}</p>}
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 20, minHeight: 44 }} disabled={busy}>{busy ? "Đang gửi..." : "Gửi liên kết xác minh"}</button>
    </form>
    <div className="login-footer"><Link href="/login">Quay lại đăng nhập</Link></div>
  </section></main>;
}
