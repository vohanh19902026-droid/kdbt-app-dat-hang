"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import type { AppRole } from "@/lib/types";
import { vnDateOf } from "@/lib/vn-date";

type Item = { id: string; title: string; body: string; createdAt: string; readAt: string | null; bookingNo: string; requestedAt: string; plannedStartAt: string | null };
export function NotificationsInbox({ initialItems, role }: { initialItems: Item[]; role: AppRole }) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const unread = items.filter((item) => !item.readAt).length;
  async function markRead(id?: string) {
    setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : { all: true }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Không cập nhật được trạng thái đọc.");
      const readAt = new Date().toISOString();
      setItems((current) => current.map((item) => (!id || item.id === id) ? { ...item, readAt: item.readAt ?? readAt } : item));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không kết nối được máy chủ."); }
  }
  return <section className="notification-panel">
    <div className="notification-toolbar"><span>{unread ? `${unread} tin chưa đọc` : "Bạn đã xem hết tin báo"}</span>{unread > 0 && <button type="button" className="btn secondary" onClick={() => void markRead()}><CheckCheck size={15} /> Đánh dấu tất cả đã đọc</button>}</div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {items.length === 0 ? <div className="notification-empty"><Bell size={25} /><b>Chưa có tin báo</b><span>Khi có booking mới hoặc kế hoạch thay đổi, tin báo sẽ xuất hiện tại đây.</span></div> : <div className="notification-list">{items.map((item) => {
      const date = item.plannedStartAt || item.requestedAt;
      const localDate = vnDateOf(new Date(date));
      const href = role === "SALES" ? `/orders?date=${localDate}` : `/orders?view=planning&date=${localDate}`;
      return <article className={`notification-item ${item.readAt ? "is-read" : "is-unread"}`} key={item.id}>
        <div className="notification-dot" aria-hidden="true" /><div className="notification-copy"><div className="notification-title-row"><b>{item.title}</b><time dateTime={item.createdAt}>{new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(item.createdAt))}</time></div><p>{item.body}</p><div className="notification-actions"><Link href={href}>Mở {item.bookingNo}</Link>{!item.readAt && <button type="button" onClick={() => void markRead(item.id)}>Đánh dấu đã đọc</button>}</div></div>
      </article>;
    })}</div>}
  </section>;
}
