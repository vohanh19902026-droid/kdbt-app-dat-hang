"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { loginErrorMessage } from "@/lib/login-error";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const result = await authClient.signIn.email({ email, password });
      if (result.error) { setError(loginErrorMessage(result.error.status)); return; }
      router.replace("/orders"); router.refresh();
    } catch {
      setError(loginErrorMessage());
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setBusy(true); setError("");
    try {
      const result = await authClient.signIn.social({ provider: "google", callbackURL: "/pending-approval" });
      if (result.error) setError("Chưa thể đăng nhập Google. Vui lòng thử lại hoặc đăng nhập bằng email và mật khẩu.");
    } catch {
      setError("Đăng nhập Google chưa được cấu hình. Vui lòng đăng nhập bằng email và mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-bg"><section className="login-card">
    <div className="login-brand"><div className="brandmark">C</div><div className="brandname">CENCOM<small>ĐIỀU PHỐI BÊ TÔNG</small></div></div>
    <h1>Đăng nhập hệ thống</h1><p className="sub">Sử dụng tài khoản công ty để tiếp tục.</p>
    <button type="button" className="btn secondary" onClick={signInWithGoogle} disabled={busy} style={{ width: "100%", justifyContent: "center", minHeight: 44, marginBottom: 16 }}>
      Đăng nhập / đăng ký bằng Google
    </button>
    <p className="sub" style={{ textAlign: "center", marginTop: -8, marginBottom: 18 }}>Khuyến nghị dùng Gmail công ty. Tài khoản mới cần Admin kích hoạt.</p>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="email">Email / tài khoản</label><input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="ten@congty.vn" /></div>
      <div className="field"><label htmlFor="password">Mật khẩu</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nhập mật khẩu" /></div>
      {error && <p className="login-error" role="alert">{error}</p>}
      <button className="btn" style={{ width: "100%", justifyContent: "center", marginTop: 20, minHeight: 44 }} disabled={busy}>{busy ? "Đang xác thực..." : "Đăng nhập"}</button>
    </form>
    <div className="login-footer">Tài khoản Gmail mới được tạo ở vai trò NVKD và chờ Admin kích hoạt trước khi sử dụng.<br />Nếu đăng nhập bằng Google mà quên mật khẩu Google, hãy khôi phục tại Google.<br /><a href="/forgot-password">Quên mật khẩu CENCOM?</a><span aria-hidden="true"> · </span><a href="/huong-dan-su-dung.html">Cẩm nang sử dụng</a></div>
  </section></main>;
}
