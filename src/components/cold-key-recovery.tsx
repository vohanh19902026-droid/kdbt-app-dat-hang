"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Environment = "preview" | "production";

export function ColdKeyRecovery({ email }: { email: string }) {
  const router = useRouter();
  const [environment, setEnvironment] = useState<Environment>("production");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const command = environment === "preview"
    ? `vercel env run -e preview --git-branch codex/google-auth-preview -- npm.cmd run auth:cold-key -- --challenge ${challengeId || "<CHALLENGE>"}`
    : `vercel env run -e production -- npm.cmd run auth:cold-key -- --challenge ${challengeId || "<CHALLENGE>"}`;

  async function createChallenge() {
    setBusy(true); setError(""); setMessage(""); setChallengeId(""); setCode("");
    try {
      const response = await fetch("/api/cold-key/challenge", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Chưa tạo được thử thách."); return; }
      setChallengeId(result.challengeId);
    } catch { setError("Không kết nối được máy chủ."); }
    finally { setBusy(false); }
  }

  async function recover(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/cold-key/recover", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code: code.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Không khôi phục được quyền."); return; }
      setMessage(result.message);
      setTimeout(() => { router.replace("/login"); router.refresh(); }, 1800);
    } catch { setError("Không kết nối được máy chủ."); }
    finally { setBusy(false); }
  }

  return <main className="login-bg"><section className="login-card" style={{ maxWidth: 680 }}>
    <div className="login-brand"><div className="brandmark">C</div><div className="brandname">CENCOM<small>CHẾ ĐỘ KHÔI PHỤC CHỦ SỞ HỮU</small></div></div>
    <h1>Chìa khóa lạnh</h1>
    <p className="sub">Đang xác thực bằng Google: <b>{email}</b>. Đây là quy trình cứu hộ khi không còn Admin nào truy cập được.</p>
    <div className="notice">Cần máy tính tin cậy có quyền truy cập Vercel của CENCOM. Thử thách chỉ dùng một lần, hết hạn sau 5 phút và khóa sau 5 lần nhập sai. Mã tạo ra trên máy tính, không lưu trong ứng dụng.</div>
    <div className="field"><label htmlFor="environment">Môi trường cần khôi phục</label><select id="environment" value={environment} onChange={(event) => setEnvironment(event.target.value as Environment)} disabled={Boolean(challengeId)}><option value="production">Production</option><option value="preview">Preview</option></select><small className="muted">Chọn đúng môi trường đang mở trong trình duyệt.</small></div>
    {!challengeId ? <button className="btn" onClick={() => void createChallenge()} disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 18 }}>{busy ? "Đang tạo thử thách…" : "Bắt đầu khôi phục"}</button> : <>
      <div className="field"><label>Mã thử thách công khai</label><input readOnly value={challengeId} onFocus={(event) => event.currentTarget.select()} /><small className="muted">Chép mã này vào lệnh bên dưới; đây không phải chìa khóa bí mật.</small></div>
      <div className="field"><label>Lệnh chạy trên PowerShell máy tính tin cậy</label><textarea readOnly rows={3} value={command} onFocus={(event) => event.currentTarget.select()} /></div>
      <form onSubmit={recover}><div className="field"><label htmlFor="code">Mã trả lời 10 chữ số *</label><input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{10}" maxLength={10} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} /></div>
        <button className="btn" disabled={busy || code.length !== 10} style={{ width: "100%", justifyContent: "center" }}>{busy ? "Đang xác minh…" : "Xác minh và khôi phục Admin"}</button>
      </form>
      <button className="btn secondary" onClick={() => void createChallenge()} disabled={busy} style={{ width: "100%", justifyContent: "center", marginTop: 10 }}>Hủy thử thách và tạo mã mới</button>
    </>}
    {error && <p className="login-error" role="alert">{error}</p>}{message && <p className="auth-notice" role="status">{message}</p>}
    <div className="login-footer"><a href="/login">Quay lại đăng nhập</a></div>
  </section></main>;
}
