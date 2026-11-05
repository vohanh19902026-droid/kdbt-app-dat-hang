"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const resetToken = query.get("token") || "";
    window.history.replaceState(null, "", "/reset-password");
    setToken(resetToken);
    if (!resetToken || query.get("error") === "INVALID_TOKEN") {
      setError("Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu gửi liên kết mới.");
    }
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!token) {
      setError("Liên kết không hợp lệ hoặc đã hết hạn. Hãy yêu cầu gửi liên kết mới.");
      return;
    }
    if (newPassword.length < 10 || newPassword.length > 128) {
      setError("Mật khẩu mới cần có từ 10 đến 128 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Hai lần nhập mật khẩu chưa khớp.");
      return;
    }
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ newPassword, token });
      if (result.error) {
        setError("Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn hoặc được dùng rồi; hãy yêu cầu liên kết mới.");
      } else {
        setNotice("Mật khẩu đã được đổi. Các phiên đăng nhập khác đã bị thu hồi.");
        setNewPassword("");
        setConfirmPassword("");
        window.setTimeout(() => router.replace("/login"), 1600);
      }
    } catch {
      setError("Không thể đặt lại mật khẩu lúc này. Vui lòng thử lại hoặc liên hệ Admin.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-bg"><section className="login-card">
    <div className="login-brand"><div className="brandmark">C</div><div className="brandname">CENCOM<small>ĐIỀU PHỐI BÊ TÔNG</small></div></div>
    <h1>Tạo mật khẩu mới</h1><p className="sub">Liên kết xác minh có hiệu lực trong 30 phút và chỉ sử dụng được một lần.</p>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="new-password">Mật khẩu mới</label><input id="new-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div>
      <div className="field"><label htmlFor="confirm-password">Nhập lại mật khẩu</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div>
      {error && <p className="login-error" role="alert">{error}</p>}
      {notice && <p className="auth-notice" role="status">{notice}</p>}
      <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 20, minHeight: 44 }} disabled={busy || !token}>{busy ? "Đang cập nhật..." : "Xác nhận mật khẩu mới"}</button>
    </form>
    <div className="login-footer"><Link href="/forgot-password">Yêu cầu liên kết mới</Link><span aria-hidden="true"> · </span><Link href="/login">Đăng nhập</Link></div>
  </section></main>;
}
