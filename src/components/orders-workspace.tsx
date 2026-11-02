"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Plus, RefreshCw, Search } from "lucide-react";
import type { TabulatorFull } from "tabulator-tables";
import "tabulator-tables/dist/css/tabulator.min.css";
import { statusLabels, type AppRole, type OrderStatus } from "@/lib/types";
import { isValidIsoDate, isValidTime, vnDateOf } from "@/lib/vn-date";

type OrderDTO = {
  id: string; bookingNo: string; customerName: string; salesRepName: string; siteAddress: string;
  contactName: string | null; contactPhone: string | null; requestedAt: Date; plannedStartAt: Date | null;
  plannedEndAt: Date | null; quantityM3: number; actualM3: number; grade: string; sandType: string;
  stoneType: string; pumpRequired: string; pumpOperator: string | null; assignedVehicle: string | null;
  truckCapacityM3: number | null; pourType: string | null; salesNote: string | null;
  planningNote: string | null; status: OrderStatus; createdBy: string; version: string;
};
type Totals = { ordered: number; actual: number; pending: number; ongoing: number };
type CustomerOption = { id: string; name: string; phone: string | null; address: string | null };
type HistoryEvent = {
  id: string; eventType: string; eventLabel: string; fieldName: string | null;
  oldValue: string | null; newValue: string | null; createdAt: string; actorName: string | null;
};
const fieldLabels: Record<string, string> = {
  plannedDate: "Ngày cấp", plannedStartAt: "Giờ xuất phát", plannedEndAt: "Giờ đổ",
  quantityM3: "KL đặt", actualM3: "KL thực đổ", grade: "Mác", sandType: "Cốt liệu I",
  stoneType: "Cốt liệu II", contactPhone: "Điện thoại", pumpOperator: "NV bơm",
  pumpRequired: "Xe bơm", assignedVehicle: "Phương tiện", truckCapacityM3: "Xe chở",
  planningNote: "Ghi chú kế hoạch", pourType: "Hạng mục", customerName: "Khách hàng",
  siteAddress: "Địa chỉ", salesNote: "Ghi chú", status: "Trạng thái",
};
const timeOfDayVN = (value: string) => new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh", hour12: false,
}).format(new Date(value));
const dateTimeVN = (value: string) => new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeStyle: "short", timeZone: "Asia/Ho_Chi_Minh", hour12: false,
}).format(new Date(value));
const dateOnlyVN = (value: string) => new Intl.DateTimeFormat("vi-VN", {
  dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh",
}).format(new Date(value));
const formatEventValue = (field: string | null, value: string | null) => {
  if (value === null || value === "") return "—";
  if (field === "plannedStartAt" || field === "plannedEndAt") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : `${timeOfDayVN(value)} · ${dateOnlyVN(value)}`;
  }
  if (field === "status") return statusLabels[value as OrderStatus] ?? value;
  return value;
};
const statusTone: Record<OrderStatus, string> = {
  PENDING: "pending", APPROVED: "approved", SCHEDULED: "scheduled",
  IN_PROGRESS: "progress", COMPLETED: "completed", CANCELLED: "cancelled",
};
const timeVN = (value: Date | string | null) => value
  ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh", hour12: false }).format(new Date(value))
  : "";
const numberVN = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[character] as string));

function PlanGrid({ rows, canEdit, onToast, onHistory }: {
  rows: OrderDTO[]; canEdit: boolean; onToast: (message: string) => void; onHistory: (order: OrderDTO) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    let grid: TabulatorFull | null = null;

    async function mountGrid(target: HTMLDivElement) {
      try {
        // Tabulator chạm document ngay khi module được nạp, nên chỉ import ở phía trình duyệt.
        const { TabulatorFull: Tabulator } = await import("tabulator-tables");
        if (disposed) return;
        const data = rows.map((order) => ({
          ...order,
          plannedDate: order.plannedStartAt ? vnDateOf(new Date(order.plannedStartAt)) : vnDateOf(new Date(order.requestedAt)),
          plannedStartTime: timeVN(order.plannedStartAt), plannedEndTime: timeVN(order.plannedEndAt),
        }));
        grid = new Tabulator(target, {
          data, index: "id", layout: "fitDataStretch", height: "calc(100vh - 360px)", minHeight: 290,
          placeholder: "Chưa có booking trong ngày này.", movableColumns: true, tooltips: true, headerSort: true,
          columns: [
            { title: "STT", formatter: "rownum", width: 46, hozAlign: "center", headerSort: false, frozen: true },
            { title: "NGÀY", field: "plannedDate", width: 106, hozAlign: "center", editor: canEdit ? "input" : false, headerFilter: "input", tooltip: "Ngày cấp hàng, định dạng YYYY-MM-DD" },
            { title: "XUẤT PHÁT", field: "plannedStartTime", width: 92, hozAlign: "center", editor: canEdit ? "input" : false, headerFilter: "input" },
            { title: "TG ĐỔ", field: "plannedEndTime", width: 78, hozAlign: "center", editor: canEdit ? "input" : false },
            { title: "MÃ ĐƠN", field: "bookingNo", width: 112, frozen: true, formatter: (cell) => `<b class="booking">${escapeHtml(cell.getValue())}</b>`,
              cellClick: (_event, cell) => onHistory(cell.getRow().getData() as OrderDTO) },
            { title: "KHÁCH HÀNG", field: "customerName", width: 145, editor: canEdit ? "input" : false },
            { title: "ĐỊA CHỈ LIÊN HỆ", field: "siteAddress", width: 185, editor: canEdit ? "input" : false, tooltip: true },
            { title: "KINH DOANH", field: "salesRepName", width: 112, editor: false },
            { title: "ĐIỆN THOẠI", field: "contactPhone", width: 105, editor: canEdit ? "input" : false },
            { title: "KL ĐẶT", field: "quantityM3", width: 72, hozAlign: "right", editor: canEdit ? "number" : false, formatter: (cell) => numberVN(Number(cell.getValue())) },
            { title: "KL THỰC ĐỔ", field: "actualM3", width: 80, hozAlign: "right", editor: canEdit ? "number" : false, formatter: (cell) => numberVN(Number(cell.getValue())) },
            { title: "MÁC", field: "grade", width: 105, editor: canEdit ? "input" : false },
            { title: "CỐT LIỆU T I", field: "sandType", width: 115, editor: canEdit ? "input" : false, cssClass: "sand-cell" },
            { title: "CỐT LIỆU T II", field: "stoneType", width: 115, editor: canEdit ? "input" : false, cssClass: "stone-cell" },
            { title: "XE BƠM", field: "pumpRequired", width: 112, editor: canEdit ? "input" : false },
            { title: "NHÂN VIÊN BƠM", field: "pumpOperator", width: 120, editor: canEdit ? "input" : false },
            { title: "PHƯƠNG TIỆN", field: "assignedVehicle", width: 125, editor: canEdit ? "input" : false, cssClass: "vehicle-cell" },
            { title: "XE CHỞ / CHUYẾN", field: "truckCapacityM3", width: 95, editor: canEdit ? "list" : false, editorParams: { values: { 5: "5 m³", 7: "7 m³", 10: "10 m³" } }, formatter: (cell) => cell.getValue() ? `${cell.getValue()} m³` : "" },
            { title: "HM", field: "pourType", width: 86, editor: canEdit ? "input" : false },
            { title: "TRẠNG THÁI", field: "status", width: 125, editor: canEdit ? "list" : false,
              editorParams: { values: Object.fromEntries(Object.entries(statusLabels).map(([key, label]) => [key, label])) },
              formatter: (cell) => {
                const status = cell.getValue() as OrderStatus;
                return `<span class="status-select ${statusTone[status]}">${escapeHtml(statusLabels[status] ?? status)}</span>`;
              } },
            { title: "GHI CHÚ KINH DOANH", field: "salesNote", width: 180, editor: false },
            { title: "GHI CHÚ KẾ HOẠCH", field: "planningNote", width: 200, editor: canEdit ? "input" : false },
          ],
        });
        grid.on("cellEdited", async (cell) => {
          const row = cell.getRow().getData() as OrderDTO & { plannedStartTime: string; plannedEndTime: string; plannedDate: string };
          const field = cell.getField();
          const value = cell.getValue();
          if ((field === "plannedStartTime" || field === "plannedEndTime") && value && !isValidTime(value)) {
            cell.restoreOldValue();
            onToast("Nhập giờ theo định dạng HH:MM.");
            return;
          }
          if (field === "plannedDate" && !isValidIsoDate(value)) {
            cell.restoreOldValue();
            onToast("Nhập ngày theo định dạng YYYY-MM-DD.");
            return;
          }
          const payload: Record<string, unknown> = {
            [field]: field.includes("Time") ? value || null : value,
            version: Number(row.version),
          };
          try {
            const response = await fetch(`/api/orders/${row.id}`, {
              method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              cell.restoreOldValue();
              onToast(result.error || "Không lưu được thay đổi.");
              return;
            }
            const saved = result.order as {
              version: string; requestedAt: string; plannedStartAt: string | null; plannedEndAt: string | null;
            };
            cell.getRow().update({
              version: String(saved.version),
              plannedDate: saved.plannedStartAt ? vnDateOf(new Date(saved.plannedStartAt)) : vnDateOf(new Date(saved.requestedAt)),
              plannedStartTime: timeVN(saved.plannedStartAt),
              plannedEndTime: timeVN(saved.plannedEndAt),
            });
            onToast("Đã lưu thay đổi và ghi lịch sử booking.");
          } catch {
            cell.restoreOldValue();
            onToast("Mất kết nối tới máy chủ. Vui lòng thử lại.");
          }
        });
      } catch (error) {
        console.error("plan_grid_init_failed", error);
        if (!disposed) onToast("Không tải được bảng điều phối. Vui lòng tải lại trang.");
      }
    }

    void mountGrid(element);
    return () => {
      disposed = true;
      grid?.destroy();
      grid = null;
    };
  }, [rows, canEdit, onToast, onHistory]);
  return <div className="plan-table" ref={host} />;
}

export function OrdersWorkspace({
  orders, customerOptions, date, role, totals, view = "orders",
}: {
  orders: OrderDTO[]; customerOptions: CustomerOption[]; date: string; role: AppRole; totals: Totals;
  statusLabels: Record<OrderStatus, string>; view?: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const selectedCustomer = customerOptions.find((customer) => customer.id === selectedCustomerId);
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<{ order: OrderDTO; rows: HistoryEvent[]; loading: boolean; error: string } | null>(null);
  const openHistory = useCallback(async (order: OrderDTO) => {
    setHistory({ order, rows: [], loading: true, error: "" });
    try {
      const response = await fetch(`/api/orders/${order.id}/events`);
      const result = await response.json().catch(() => ({}));
      setHistory((current) => {
        if (!current || current.order.id !== order.id) return current;
        if (!response.ok) return { order, rows: [], loading: false, error: result.error || "Không tải được lịch sử thay đổi." };
        return { order, rows: Array.isArray(result.events) ? result.events : [], loading: false, error: "" };
      });
    } catch {
      setHistory((current) => current && current.order.id === order.id
        ? { order, rows: [], loading: false, error: "Mất kết nối tới máy chủ. Vui lòng thử lại." }
        : current);
    }
  }, []);
  const planner = ["ADMIN", "PLANNER"].includes(role);
  const canCreate = ["ADMIN", "PLANNER", "SALES"].includes(role);
  const visible = useMemo(() => orders.filter((order) =>
    (status === "ALL" || order.status === status)
      && `${order.bookingNo} ${order.customerName} ${order.siteAddress} ${order.salesRepName}`.toLowerCase().includes(search.toLowerCase())),
  [orders, status, search]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);
  async function createOrder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const requestedAt = new Date(`${form.get("date")}T${form.get("time")}:00+07:00`).toISOString();
    const payload = {
      customerId: selectedCustomer?.id,
      customerName: form.get("customerName"), siteAddress: form.get("siteAddress"),
      contactName: form.get("contactName"), contactPhone: form.get("contactPhone"), requestedAt,
      quantityM3: form.get("quantityM3"), grade: form.get("grade"), sandType: form.get("sandType"),
      stoneType: form.get("stoneType"), pumpRequired: form.get("pumpRequired"),
      truckCapacityM3: form.get("truckCapacityM3"), pourType: form.get("pourType"), salesNote: form.get("salesNote"),
    };
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Không lưu được đơn hàng."); return; }
      setShowForm(false); setSelectedCustomerId(""); setToast(result.message || "Đã tạo booking."); router.refresh();
    } catch {
      setError("Mất kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  }
  function exportPlan() {
    const link = document.createElement("a");
    link.href = `/api/exports/xlsx?date=${encodeURIComponent(date)}`;
    link.download = `ke-hoach-${date}.xlsx`;
    document.body.appendChild(link); link.click(); link.remove();
  }
  const dateLabel = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(`${date}T12:00:00+07:00`));
  return <>
    <div className="pagehead">
      <div><div className="eyebrow">{planner ? "ĐIỀU PHỐI SẢN XUẤT" : "ĐẶT HÀNG BÊ TÔNG"} · {dateLabel}</div>
        <h1>{planner && view === "planning" ? "Bảng kế hoạch cấp hàng" : "Đơn đặt bê tông"}</h1>
        <div className="sub">{planner ? "Xác nhận booking, sắp xếp giờ cấp và phân công phương tiện." : "Tạo booking và theo dõi tiến độ cấp bê tông của bạn."}</div>
      </div>
      <div className="heading-actions">
        <input type="date" aria-label="Ngày kế hoạch" className="date-input" value={date} onChange={(event) => router.push(`/orders?date=${event.target.value}&view=${view}`)} />
        {planner && <button className="btn secondary" onClick={exportPlan}><Download size={15} /> Xuất XLSX</button>}
        {canCreate && <button className="btn" onClick={() => { setSelectedCustomerId(""); setError(""); setShowForm(true); }}><Plus size={17} /> Tạo booking</button>}
      </div>
    </div>
    <div className="stats">
      <div className="stat"><div className="stathead">Tổng khối lượng đặt</div><strong>{numberVN(totals.ordered)} <small>m³</small></strong><small>{orders.length} booking trong ngày</small></div>
      <div className="stat"><div className="stathead">Khối lượng thực đổ</div><strong>{numberVN(totals.actual)} <small>m³</small></strong><small>Ghi nhận của kế hoạch</small></div>
      <div className="stat"><div className="stathead">Chờ duyệt</div><strong>{totals.pending}</strong><small>Cần xác nhận lịch cấp</small></div>
      <div className="stat"><div className="stathead">Đang cấp hàng</div><strong>{totals.ongoing}</strong><small>Đang vận chuyển tới công trình</small></div>
    </div>
    <div className="toolbar">
      <div className="filter-row">
        <select className="pill" value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="ALL">Tất cả trạng thái</option>
          {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        {planner && <button className="pill" onClick={exportPlan}><Download size={14} /> Xuất bảng Excel</button>}
        <button className="pill" onClick={() => router.refresh()} title="Tải lại"><RefreshCw size={14} /></button>
      </div>
      <div className="search-wrap"><Search size={15} /><input className="search" placeholder="Tìm booking, khách hàng, địa chỉ..." value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    </div>
    <div className="tablewrap"><PlanGrid rows={visible} canEdit={planner} onToast={setToast} onHistory={openHistory} /></div>
    <div className="desktop-note">{planner
      ? "Chỉnh trực tiếp giờ, vật liệu, phương tiện hoặc trạng thái. Mỗi thay đổi được lưu và ghi vào lịch sử booking."
      : "Danh sách chỉ hiển thị booking do bạn tạo. Mã booking được cấp tự động."}</div>
    {showForm && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowForm(false); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="form-title">
        <div className="modalhead"><div><div className="eyebrow">ĐẶT LỊCH MỚI</div><h2 id="form-title">Đặt bê tông</h2><div className="sub">Hệ thống tự cấp mã booking khi lưu.</div></div>
          <button className="close" onClick={() => setShowForm(false)} aria-label="Đóng">×</button></div>
        <form onSubmit={createOrder}><div className="formgrid">
          <div className="field full"><label htmlFor="existing-customer">Chọn khách hàng *</label><select id="existing-customer" required value={selectedCustomerId} onChange={(event) => setSelectedCustomerId(event.target.value)}><option value="" disabled>Chọn khách đã có hoặc tạo khách mới</option><option value="new">Tạo khách hàng mới</option>{customerOptions.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.phone || customer.address || "Chưa có liên hệ"}</option>)}</select><small>Chọn khách đã có để theo dõi công nợ chung. Chọn tạo mới nếu đây là khách khác.</small></div>
          <div className="field"><label>Tên khách hàng *</label><input key={`name-${selectedCustomerId}`} name="customerName" required minLength={2} maxLength={180} defaultValue={selectedCustomer?.name ?? ""} readOnly={Boolean(selectedCustomer)} placeholder="VD: Công ty xây dựng ABC" /></div>
          <div className="field"><label>Người liên hệ</label><input name="contactName" maxLength={120} placeholder="Người nhận tại công trình" /></div>
          <div className="field full"><label>Địa chỉ công trình *</label><input key={`address-${selectedCustomerId}`} name="siteAddress" required minLength={3} maxLength={500} defaultValue={selectedCustomer?.address ?? ""} placeholder="Địa chỉ giao bê tông" /></div>
          <div className="field"><label>Điện thoại liên hệ</label><input key={`phone-${selectedCustomerId}`} name="contactPhone" inputMode="tel" maxLength={30} defaultValue={selectedCustomer?.phone ?? ""} placeholder="09xx xxx xxx" /></div>
          <div className="field"><label>Khối lượng đặt (m³) *</label><input type="number" name="quantityM3" required min="0.1" max="5000" step="0.1" placeholder="Ví dụ: 25" /></div>
          <div className="field"><label>Mác bê tông *</label><input name="grade" list="concrete-grades" required placeholder="VD: 250 (12+2)" /><datalist id="concrete-grades"><option value="250 (12+2)" /><option value="250R (14+2)" /><option value="300 (12+2)" /><option value="300R (7+12)" /><option value="C30 (12+2)" /><option value="B35 (19+1)" /></datalist></div>
          <div className="field"><label>Ngày cần cấp *</label><input type="date" name="date" required defaultValue={date} /></div>
          <div className="field"><label>Giờ cần cấp *</label><input type="time" name="time" required defaultValue="08:00" /></div>
          <div className="field"><label>Loại xe bơm</label><select name="pumpRequired"><option>Bơm cần 38m</option><option>Bơm 42m</option><option>Bơm 50m</option><option>Bơm 63m</option><option>Bơm tĩnh</option><option>Không bơm</option></select></div>
          <div className="field"><label>Loại cát *</label><input name="sandType" list="sand-types" required placeholder="Chọn hoặc nhập loại cát" /><datalist id="sand-types"><option value="Cát Lộc" /><option value="Cát vàng" /><option value="Cát nghiền" /><option value="Cát sông" /></datalist></div>
          <div className="field"><label>Loại đá *</label><input name="stoneType" list="stone-types" required placeholder="Chọn hoặc nhập loại đá" /><datalist id="stone-types"><option value="Đá 1x2" /><option value="Đá 0.5x1" /><option value="Đá 2x4" /><option value="Đá mi" /></datalist></div>
          <div className="field"><label>Xe chở (m³/chuyến)</label><select name="truckCapacityM3"><option value="5">5 m³/chuyến</option><option value="7">7 m³/chuyến</option><option value="10">10 m³/chuyến</option></select></div>
          <div className="field"><label>Hạng mục</label><select name="pourType"><option value="Sàn">Sàn</option><option value="Móng">Móng</option><option value="Cột">Cột</option><option value="Dầm">Dầm</option><option value="Tường">Tường</option><option value="Khác">Khác</option></select></div>
          <div className="field full"><label>Ghi chú thêm</label><textarea name="salesNote" maxLength={1000} placeholder="Vị trí đổ, lưu ý đường vào, liên hệ công trường..." /></div>
        </div>
          {error && <div className="form-error" role="alert">{error}</div>}
          <div className="modalfoot"><button type="button" className="btn secondary" onClick={() => setShowForm(false)}>Hủy</button>
            <button className="btn" disabled={busy}>{busy ? "Đang lưu..." : "Gửi lệnh đặt hàng →"}</button></div>
        </form>
      </section>
    </div>}
    {history && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistory(null); }}>
      <section className="modal history-modal" role="dialog" aria-modal="true" aria-labelledby="history-title">
        <div className="modalhead">
          <div>
            <div className="eyebrow">LỊCH SỬ THAY ĐỔI</div>
            <h2 id="history-title">{history.order.bookingNo}</h2>
            <div className="sub">{history.order.customerName}</div>
          </div>
          <button className="close" onClick={() => setHistory(null)} aria-label="Đóng">×</button>
        </div>
        {history.loading && <p className="sub" role="status">Đang tải lịch sử…</p>}
        {history.error && <div className="form-error" role="alert">{history.error}</div>}
        {!history.loading && !history.error && history.rows.length === 0 && <p className="sub">Chưa có thay đổi nào được ghi cho booking này.</p>}
        {history.rows.length > 0 && <div className="history-scroll">
          <table className="history-table">
            <thead><tr><th>Thời điểm</th><th>Người thực hiện</th><th>Nội dung</th><th>Trước</th><th>Sau</th></tr></thead>
            <tbody>{history.rows.map((event) => <tr key={event.id}>
              <td className="nowrap">{dateTimeVN(event.createdAt)}</td>
              <td>{event.actorName ?? "—"}</td>
              <td>{event.eventLabel}{event.fieldName ? ` · ${fieldLabels[event.fieldName] ?? event.fieldName}` : ""}</td>
              <td>{formatEventValue(event.fieldName, event.oldValue)}</td>
              <td>{formatEventValue(event.fieldName, event.newValue)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
      </section>
    </div>}
    {toast && <div className="toast" role="status">{toast}</div>}
  </>;
}
