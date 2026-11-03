"use client";

import { useEffect, useState } from "react";
import { BellRing, LoaderCircle, Save } from "lucide-react";
import type { AppRole } from "@/lib/types";
import { roleLabels } from "@/lib/types";
import type { NotificationPreferences } from "@/lib/notification-preferences";

type Source = { id: string; name: string; email: string; appRole: AppRole };
const initial: NotificationPreferences = { newBooking: true, orderUpdates: true, webPushEnabled: false, sourceUserIds: [] };
function decodeKey(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = window.atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

export function NotificationSettings() {
  const [preferences, setPreferences] = useState(initial);
  const [sources, setSources] = useState<Source[]>([]);
  const [recipientRole, setRecipientRole] = useState<AppRole | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [pushAvailable, setPushAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void fetch("/api/notifications/preferences", { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Không tải được thiết lập thông báo.");
      if (!active) return;
      setPreferences(data.preferences as NotificationPreferences);
      setSources(data.sources as Source[]);
      setRecipientRole(data.recipientRole as AppRole);
      setVapidPublicKey(data.vapidPublicKey as string | null);
      setPushAvailable(Boolean(data.pushAvailable));
    }).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Mất kết nối tới máy chủ."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function update<K extends keyof NotificationPreferences>(key: K, value: NotificationPreferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setMessage(""); setError("");
  }

  async function save(next = preferences) {
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/notifications/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(next) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không lưu được thiết lập.");
      setPreferences(result.preferences as NotificationPreferences);
      setMessage("Đã lưu thiết lập thông báo cho tài khoản này.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Mất kết nối tới máy chủ."); }
    finally { setBusy(false); }
  }

  async function setPush(enabled: boolean) {
    if (!enabled) {
      const existing = await navigator.serviceWorker?.getRegistration().then((registration) => registration?.pushManager.getSubscription());
      if (existing) {
        await fetch("/api/notifications/push-subscriptions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: existing.endpoint }) });
        await existing.unsubscribe();
      }
      const next = { ...preferences, webPushEnabled: false };
      setPreferences(next); await save(next); return;
    }
    if (!pushAvailable || !vapidPublicKey || !("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setError("Thiết bị hoặc máy chủ chưa hỗ trợ Web Push. Hộp thư thông báo trong ứng dụng vẫn hoạt động."); return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") throw new Error("Bạn chưa cấp quyền thông báo cho ứng dụng trong trình duyệt.");
      const registration = await navigator.serviceWorker.register("/sw.js");
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(vapidPublicKey) });
      const response = await fetch("/api/notifications/push-subscriptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription.toJSON()) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không đăng ký được thiết bị nhận tin.");
      const next = { ...preferences, webPushEnabled: true };
      setPreferences(next); await save(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không bật được thông báo trên thiết bị."); setBusy(false); }
  }

  if (loading) return <section className="notification-settings"><div className="notification-settings-title"><BellRing size={18} /><b>Thiết lập nhận thông báo</b></div><p className="muted">Đang tải thiết lập…</p></section>;
  const receivesNewBookings = recipientRole === "ADMIN" || recipientRole === "PLANNER";
  const receivesOrderUpdates = recipientRole === "SALES";
  return <section className="notification-settings">
    <div className="notification-settings-title"><BellRing size={18} /><div><b>Thiết lập nhận thông báo</b><p>Áp dụng riêng cho tài khoản đang đăng nhập.</p></div></div>
    {receivesNewBookings && <label className="notification-setting-row"><span><b>Booking mới cần duyệt</b><small>Nhận tin khi nhân viên kinh doanh gửi đơn đặt bê tông.</small></span><input type="checkbox" checked={preferences.newBooking} onChange={(event) => update("newBooking", event.target.checked)} /></label>}
    {receivesOrderUpdates && <label className="notification-setting-row"><span><b>Kế hoạch duyệt hoặc cập nhật đơn</b><small>Nhận tin khi kế hoạch hoặc quản trị viên thay đổi booking của bạn.</small></span><input type="checkbox" checked={preferences.orderUpdates} onChange={(event) => update("orderUpdates", event.target.checked)} /></label>}
    {!receivesNewBookings && !receivesOrderUpdates && <p className="muted">Vai trò này chưa có luồng thông báo đơn hàng cần thiết lập.</p>}
    <fieldset className="notification-sources"><legend>Chỉ nhận từ tài khoản nào?</legend>
      <p className="muted">Để trống lựa chọn để nhận từ tất cả tài khoản phù hợp.</p>
      {sources.length === 0 ? <p className="muted">Chưa có tài khoản gửi thông báo phù hợp.</p> : <div className="notification-source-list">{sources.map((source) => <label key={source.id}><input type="checkbox" checked={preferences.sourceUserIds.includes(source.id)} onChange={(event) => update("sourceUserIds", event.target.checked ? [...preferences.sourceUserIds, source.id] : preferences.sourceUserIds.filter((id) => id !== source.id))} /><span><b>{source.name}</b><small>{source.email} · {roleLabels[source.appRole]}</small></span></label>)}</div>}
    </fieldset>
    <div className="notification-setting-actions">
      <button type="button" className="btn secondary" onClick={() => void save()} disabled={busy}><Save size={15} />{busy ? "Đang lưu…" : "Lưu thiết lập"}</button>
      {pushAvailable ? <button type="button" className={`btn ${preferences.webPushEnabled ? "secondary" : ""}`} onClick={() => void setPush(!preferences.webPushEnabled)} disabled={busy}>{busy && <LoaderCircle size={15} className="spin" />}{preferences.webPushEnabled ? "Tắt thông báo trên thiết bị này" : "Bật thông báo trên thiết bị này"}</button> : <span className="muted">Push chưa được cấu hình trên máy chủ; tin trong hộp thư vẫn dùng bình thường.</span>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}{message && <p className="muted" role="status">{message}</p>}
  </section>;
}
