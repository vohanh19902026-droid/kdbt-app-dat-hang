"use client";

import { useEffect, useState } from "react";
import { ArchiveRestore, CircleOff, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { AppSettings } from "@/lib/app-settings";
import type { ProductCatalogKey } from "@/lib/product-catalog";

const categories: Array<{ key: ProductCatalogKey; label: string; hint: string }> = [
  { key: "grades", label: "Mác bê tông", hint: "Ví dụ: 250 (12+2)" },
  { key: "sandTypes", label: "Loại cát", hint: "Ví dụ: Cát vàng" },
  { key: "stoneTypes", label: "Loại đá", hint: "Ví dụ: Đá 1x2" },
  { key: "pumpTypes", label: "Loại xe bơm", hint: "Ví dụ: Bơm cần 42m" },
  { key: "serviceVehicles", label: "Phương tiện phục vụ", hint: "Phương tiện kế hoạch có thể chọn" },
  { key: "truckCapacitiesM3", label: "Dung tích xe chở (m³/chuyến)", hint: "Nhập số từ 0 đến 30" },
  { key: "pourTypes", label: "Hạng mục đổ / cấu kiện", hint: "Sàn, mái, dầm, móng đơn…" },
  { key: "pourMethods", label: "Hình thức đổ", hint: "Đổ xả hoặc bơm" },
  { key: "siteCategories", label: "Loại công trình", hint: "Dự án hoặc dân cư" },
];

type Props = {
  catalog: AppSettings["catalog"];
  archived: AppSettings["catalogArchived"];
  canDelete: boolean;
  allowedKeys?: ProductCatalogKey[];
  onChange: (catalog: AppSettings["catalog"], archived: AppSettings["catalogArchived"]) => void;
};

export function ProductCatalogManager({ catalog, archived, canDelete, allowedKeys, onChange }: Props) {
  const [drafts, setDrafts] = useState<Partial<Record<ProductCatalogKey, string>>>({});
  const [pending, setPending] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [auditVersion, setAuditVersion] = useState(0);
  const [audit, setAudit] = useState<Array<{ eventType: string; entityKey: ProductCatalogKey; oldValue: string | null; newValue: string | null; createdAt: string; actorName: string }>>([]);

  useEffect(() => {
    if (!canDelete) return;
    let active = true;
    void fetch("/api/catalog", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { audit?: typeof audit };
      if (active && result.audit) setAudit(result.audit);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [canDelete, auditVersion]);

  async function change(key: ProductCatalogKey, action: "add" | "disable" | "restore" | "delete", value: string) {
    setError(""); setNotice(""); setPending(`${key}:${action}:${value}`);
    try {
      const response = await fetch("/api/catalog", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, action, value }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string; catalog?: AppSettings["catalog"]; catalogArchived?: AppSettings["catalogArchived"] };
      if (!response.ok || !result.catalog || !result.catalogArchived) throw new Error(result.error || "Không cập nhật được mục này.");
      onChange(result.catalog, result.catalogArchived);
      if (canDelete) setAuditVersion((version) => version + 1);
      setNotice(action === "add" ? "Đã thêm lựa chọn mới." : action === "disable" ? "Đã ngừng dùng. Dữ liệu đơn hàng cũ vẫn được giữ." : action === "restore" ? "Đã khôi phục lựa chọn." : "Đã xóa mục không còn được sử dụng.");
      if (action === "add") setDrafts((items) => ({ ...items, [key]: "" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Không cập nhật được danh mục."); }
    finally { setPending(""); }
  }

  return <div className="catalog-manager">
    <div className="settings-section-intro"><div><h2>Danh mục cho booking mới</h2><p>Thao tác từng lựa chọn. Mục đã dùng sẽ được ngừng sử dụng và giữ lại trong đơn cũ.</p></div></div>
    {error && <div className="notice settings-notice error" role="alert">{error}</div>}
    {notice && <div className="notice settings-notice" role="status">{notice}</div>}
    <div className="catalog-manager-grid">
      {categories.filter(({ key }) => !allowedKeys || allowedKeys.includes(key)).map(({ key, label, hint }) => {
        const activeItems = catalog[key] as Array<string | number>;
        const archivedItems = archived[key];
        const addPending = pending.startsWith(`${key}:add:`);
        return <section className="settings-card catalog-card" key={key} aria-labelledby={`catalog-${key}`}>
          <div className="catalog-card-head"><div><h3 id={`catalog-${key}`}>{label}</h3><span>{activeItems.length} đang sử dụng</span></div></div>
          <form className="catalog-add-form" onSubmit={(event) => { event.preventDefault(); const value = (drafts[key] ?? "").trim(); if (value) void change(key, "add", value); }}>
            <input aria-label={`Tên lựa chọn mới: ${label}`} maxLength={key === "truckCapacitiesM3" ? 10 : 120} inputMode={key === "truckCapacitiesM3" ? "decimal" : undefined} placeholder={hint} value={drafts[key] ?? ""} onChange={(event) => setDrafts((items) => ({ ...items, [key]: event.target.value }))} />
            <button className="btn" disabled={pending !== "" || addPending || !(drafts[key] ?? "").trim()}><Plus size={15} /> Thêm</button>
          </form>
          <ul className="catalog-item-list">{activeItems.map((item) => {
            const value = String(item);
            const itemPending = pending === `${key}:disable:${value}`;
            return <li key={`${key}:${value}`}><span>{value}</span><button type="button" className="catalog-action" disabled={pending !== ""} onClick={() => { if (window.confirm(`Ngừng dùng “${value}” cho booking mới? Đơn hàng cũ vẫn giữ nguyên và bạn có thể khôi phục sau.`)) void change(key, "disable", value); }} aria-label={`Ngừng sử dụng ${value}`} title="Ngừng dùng cho lựa chọn mới"><CircleOff size={15} /> Ngừng dùng</button>{itemPending && <span className="muted">Đang lưu…</span>}</li>;
          })}</ul>
          {archivedItems.length > 0 && <details className="catalog-archived"><summary><ArchiveRestore size={14} /> Đã ngừng dùng ({archivedItems.length})</summary>
            <ul className="catalog-item-list archived-list">{archivedItems.map((value) => <li key={`${key}:archived:${value}`}><span>{value}</span><div>
              <button type="button" className="catalog-action" disabled={pending !== ""} onClick={() => void change(key, "restore", value)} aria-label={`Khôi phục ${value}`}><RotateCcw size={14} /> Khôi phục</button>
              {canDelete && <button type="button" className="catalog-action danger" disabled={pending !== ""} onClick={() => { if (window.confirm(`Xóa hẳn “${value}”? Chỉ xóa được khi mục này chưa xuất hiện trong đơn hàng.`)) void change(key, "delete", value); }} aria-label={`Xóa hẳn ${value}`} title="Chỉ xóa nếu chưa được dùng"><Trash2 size={14} /> Xóa hẳn</button>}
            </div></li>)}</ul>
          </details>}
          {activeItems.length === 0 && <p className="catalog-empty">Chưa có lựa chọn. Thêm ít nhất một mục trước khi lưu.</p>}
        </section>;
      })}
    </div>
    <div className="settings-note">Ngừng dùng sẽ ẩn mục khỏi các booking mới, nhưng không sửa dữ liệu lịch sử. Xóa hẳn cần Admin xác nhận và máy chủ sẽ từ chối nếu mục đã xuất hiện trong đơn hàng.</div>
    {canDelete && <details className="settings-card catalog-audit"><summary>Nhật ký thay đổi danh mục gần đây ({audit.length})</summary>
      {audit.length ? <div className="tablewrap"><table className="grid"><thead><tr><th>THỜI ĐIỂM</th><th>NGƯỜI THAO TÁC</th><th>LOẠI DANH MỤC</th><th>THAY ĐỔI</th></tr></thead><tbody>{audit.map((entry, index) => <tr key={`${entry.createdAt}:${index}`}><td>{new Date(entry.createdAt).toLocaleString("vi-VN")}</td><td>{entry.actorName}</td><td>{categories.find((item) => item.key === entry.entityKey)?.label ?? entry.entityKey}</td><td>{({ CATALOG_ADD: "Thêm", CATALOG_DISABLE: "Ngừng dùng", CATALOG_RESTORE: "Khôi phục", CATALOG_DELETE: "Xóa hẳn" } as Record<string, string>)[entry.eventType] ?? entry.eventType}: {entry.newValue ?? entry.oldValue ?? "—"}</td></tr>)}</tbody></table></div> : <p className="muted">Chưa có thay đổi danh mục.</p>}
    </details>}
  </div>;
}
