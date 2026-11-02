"use client";

import { useCallback, useState } from "react";
import { formatVnd } from "@/lib/receivables";
import type { AppRole } from "@/lib/types";

type EntryType = "CHARGE" | "PAYMENT";
type CustomerOption = { id: string; name: string };
type SalesRepOption = { id: string; name: string; isActive: boolean };
type OrderOption = { id: string; customerId: string | null; bookingNo: string; customerName: string };
type LedgerEntry = {
  id: string; customerName: string; salesRepName: string | null; bookingNo: string | null; entryType: EntryType;
  amountVnd: string; referenceNo: string | null; occurredAt: string; note: string | null; createdByName: string | null;
};
type Balance = { customerId: string; customerName: string; salesRepId: string | null; salesRepName: string | null; chargesVnd: string; paymentsVnd: string; balanceVnd: string };
type LedgerData = {
  period: { from: string; to: string; clamped: boolean; maxDays: number };
  periodTotals: { chargesVnd: string; paymentsVnd: string };
  allTimeBalanceVnd: string;
  balances: Balance[];
  customers: CustomerOption[];
  salesReps: SalesRepOption[];
  salesRepFilter: string | null;
  salesRepFilterLabel: string;
  recentOrders: OrderOption[];
  entries: LedgerEntry[];
  maxEntriesReached: boolean;
};

function dateLabel(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeZone: "Asia/Ho_Chi_Minh" }).format(new Date(iso));
}

export function AccountingLedger({ initialData, role }: { initialData: LedgerData; role: AppRole }) {
  const isSales = role === "SALES";
  const [from, setFrom] = useState(initialData.period.from);
  const [to, setTo] = useState(initialData.period.to);
  const [salesRepId, setSalesRepId] = useState(initialData.salesRepFilter ?? "");
  const [data, setData] = useState<LedgerData | null>(initialData);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [entryType, setEntryType] = useState<EntryType>(isSales ? "PAYMENT" : "CHARGE");
  const [customerId, setCustomerId] = useState("");
  const [orderId, setOrderId] = useState("");
  const [amountVnd, setAmountVnd] = useState("");
  const [occurredOn, setOccurredOn] = useState(initialData.period.to);
  const [referenceNo, setReferenceNo] = useState("");
  const [note, setNote] = useState("");
  const [assignmentBusyId, setAssignmentBusyId] = useState("");

  const load = useCallback(async (start: string, end: string, rep: string) => {
    setBusy(true);
    setError("");
    try {
      const query = new URLSearchParams({ from: start, to: end });
      if (rep) query.set("salesRepId", rep);
      const response = await fetch(`/api/accounting?${query}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Không tải được sổ công nợ.");
      setData(body as LedgerData);
      setFrom((body as LedgerData).period.from);
      setTo((body as LedgerData).period.to);
      setSalesRepId((body as LedgerData).salesRepFilter ?? "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Không tải được sổ công nợ.");
    } finally {
      setBusy(false);
    }
  }, []);

  async function assignSalesRep(customer: Balance, nextSalesRepId: string) {
    if ((customer.salesRepId ?? "") === nextSalesRepId) return;
    setAssignmentBusyId(customer.customerId); setError(""); setNotice("");
    try {
      const response = await fetch("/api/accounting", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify({ customerId: customer.customerId, salesRepId: nextSalesRepId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Không cập nhật được nhân viên phụ trách.");
      setNotice(`Đã cập nhật NVKD phụ trách khách ${customer.customerName}.`);
      await load(from, to, salesRepId);
    } catch (assignmentError) {
      setError(assignmentError instanceof Error ? assignmentError.message : "Không cập nhật được nhân viên phụ trách.");
    } finally {
      setAssignmentBusyId("");
    }
  }

  const filteredOrders = (data?.recentOrders ?? []).filter((order) => order.customerId === customerId);

  async function saveEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/accounting", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ customerId, orderId: orderId || null, entryType, amountVnd, occurredOn, referenceNo, note }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Không ghi được giao dịch.");
      setAmountVnd(""); setReferenceNo(""); setNote(""); setOrderId("");
      setNotice(body.message || "Đã lưu giao dịch.");
      await load(from, to, salesRepId);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Không ghi được giao dịch.");
    } finally {
      setSaving(false);
    }
  }

  const periodCharges = data?.periodTotals.chargesVnd ?? "0";
  const periodPayments = data?.periodTotals.paymentsVnd ?? "0";
  return <div className="ledger-page">
    <div className="pagehead">
      <div><div className="eyebrow">SỔ THEO DÕI THU KHÁCH HÀNG</div><h1>{isSales ? "Công nợ khách hàng của tôi" : "Công nợ khách hàng"}</h1><div className="sub">{isSales ? "Theo dõi khách hàng được giao và ghi nhận tiền đã thu. Báo lại kế toán để điều chỉnh khoản phải thu." : "Ghi nhận khoản phải thu và tiền đã thu theo khách hàng; không tự tính giá từ khối lượng bê tông."}</div></div>
      <div className="heading-actions">
        <a className="btn secondary" href={`/api/accounting/export?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${salesRepId ? `&salesRepId=${encodeURIComponent(salesRepId)}` : ""}`}>Xuất XLSX</a>
        <form className="filter-row ledger-filter" onSubmit={(event) => { event.preventDefault(); void load(from, to, salesRepId); }}>
          <label className="sub">Từ ngày <input className="date-input" type="date" value={from} onChange={(event) => setFrom(event.target.value)} required /></label>
          <label className="sub">Đến ngày <input className="date-input" type="date" value={to} onChange={(event) => setTo(event.target.value)} required /></label>
          {!isSales && <label className="sub">NVKD phụ trách <select className="date-input" value={salesRepId} onChange={(event) => setSalesRepId(event.target.value)}><option value="">Tất cả nhân viên</option><option value="unassigned">Chưa phân công</option>{data?.salesReps.map((rep) => <option key={rep.id} value={rep.id}>{rep.name}{rep.isActive ? "" : " (ngừng hoạt động)"}</option>)}</select></label>}
          <button className="btn secondary" disabled={busy}>{busy ? "Đang tải…" : "Lọc"}</button>
        </form>
      </div>
    </div>

    {data?.period.clamped && <div className="notice" role="status">Khoảng ngày được giới hạn tối đa {data.period.maxDays} ngày. Đang xem {dateLabel(`${data.period.from}T12:00:00+07:00`)} – {dateLabel(`${data.period.to}T12:00:00+07:00`)}.</div>}
    {error && <div className="form-error ledger-message" role="alert">{error}</div>}
    {notice && <div className="notice" role="status">{notice}</div>}

    <div className="stats ledger-stats">
      <div className="stat"><div className="stathead">Phải thu trong kỳ</div><strong>{formatVnd(periodCharges)}</strong><small>{from} đến {to}</small></div>
      <div className="stat"><div className="stathead">Đã thu trong kỳ</div><strong>{formatVnd(periodPayments)}</strong><small>{from} đến {to}</small></div>
      <div className="stat"><div className="stathead">Còn phải thu lũy kế</div><strong>{formatVnd(data?.allTimeBalanceVnd ?? "0")}</strong><small>Số phải thu trừ tiền đã thu</small></div>
    </div>

    <section className="ledger-panel">
      <div className="ledger-panel-head"><div><h2>{isSales ? "Ghi nhận tiền đã thu" : "Ghi sổ giao dịch"}</h2><p>{isSales ? "Chỉ ghi khoản tiền đã thực nhận. Không ghi khoản phải thu hoặc sửa phân công khách hàng." : "Giao dịch đã lưu không thể sửa/xóa; ghi bút toán đối ứng để điều chỉnh."}</p></div></div>
      <form className="formgrid ledger-form" onSubmit={saveEntry}>
        {!isSales && <div className="field"><label htmlFor="ledger-type">Loại giao dịch *</label><select id="ledger-type" value={entryType} onChange={(event) => setEntryType(event.target.value as EntryType)}><option value="CHARGE">Ghi tăng khoản phải thu</option><option value="PAYMENT">Ghi nhận tiền đã thu</option></select></div>}
        <div className="field"><label htmlFor="ledger-customer">Khách hàng *</label><select id="ledger-customer" value={customerId} onChange={(event) => { setCustomerId(event.target.value); setOrderId(""); }} required><option value="">Chọn khách hàng</option>{data?.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></div>
        <div className="field"><label htmlFor="ledger-order">Booking liên quan</label><select id="ledger-order" value={orderId} onChange={(event) => setOrderId(event.target.value)} disabled={!customerId}><option value="">Không gắn booking</option>{filteredOrders.map((order) => <option key={order.id} value={order.id}>{order.bookingNo} · {order.customerName}</option>)}</select></div>
        <div className="field"><label htmlFor="ledger-amount">Số tiền (VND) *</label><input id="ledger-amount" type="number" min="1" max="999999999999999" step="1" inputMode="numeric" value={amountVnd} onChange={(event) => setAmountVnd(event.target.value)} required /></div>
        <div className="field"><label htmlFor="ledger-date">Ngày phát sinh *</label><input id="ledger-date" type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required /></div>
        <div className="field"><label htmlFor="ledger-ref">Số hóa đơn / phiếu thu</label><input id="ledger-ref" maxLength={100} value={referenceNo} onChange={(event) => setReferenceNo(event.target.value)} placeholder="Không bắt buộc" /></div>
        <div className="field full"><label htmlFor="ledger-note">Diễn giải</label><textarea id="ledger-note" maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ghi chú ngắn về giao dịch" /></div>
        <div className="ledger-submit"><button className="btn" disabled={saving || !data?.customers.length}>{saving ? "Đang lưu…" : "Ghi sổ"}</button></div>
      </form>
      {!data?.customers.length && <p className="desktop-note">Chưa có khách hàng. Hãy tạo booking trước để danh sách khách hàng được tạo.</p>}
    </section>

    <section className="ledger-section">
      <div className="ledger-section-head"><h2>Số dư theo khách hàng</h2><span className="sub">Toàn bộ lịch sử ghi sổ · {data?.salesRepFilterLabel ?? "Tất cả nhân viên"}</span></div>
      <div className="tablewrap"><table className="grid ledger-grid"><thead><tr><th>KHÁCH HÀNG</th><th>NVKD PHỤ TRÁCH</th><th>TỔNG PHẢI THU</th><th>TỔNG ĐÃ THU</th><th>CÒN PHẢI THU</th></tr></thead>
        <tbody>{data?.balances.map((balance) => <tr key={balance.customerId}><td><b>{balance.customerName}</b></td><td>{isSales ? (balance.salesRepName ?? "Bạn") : <select className="ledger-owner-select" aria-label={`NVKD phụ trách ${balance.customerName}`} value={balance.salesRepId ?? ""} disabled={assignmentBusyId === balance.customerId} onChange={(event) => void assignSalesRep(balance, event.target.value)}><option value="">Chưa phân công</option>{data.salesReps.map((rep) => <option key={rep.id} value={rep.id} disabled={!rep.isActive && rep.id !== balance.salesRepId}>{rep.name}{rep.isActive ? "" : " (ngừng hoạt động)"}</option>)}</select>}</td><td>{formatVnd(balance.chargesVnd)}</td><td>{formatVnd(balance.paymentsVnd)}</td><td className={BigInt(balance.balanceVnd) > 0n ? "ledger-debt" : ""}>{formatVnd(balance.balanceVnd)}</td></tr>)}</tbody></table>
        {!data?.balances.length && <div className="empty">Chưa có giao dịch công nợ.</div>}
      </div>
    </section>

    <section className="ledger-section">
      <div className="ledger-section-head"><h2>Giao dịch trong khoảng lọc</h2><span className="sub">{data?.entries.length ?? 0} giao dịch</span></div>
      {data?.maxEntriesReached && <div className="notice">Đang hiển thị 1.000 giao dịch gần nhất trong khoảng. Hãy lọc khoảng ngày ngắn hơn để xem chi tiết.</div>}
      <div className="tablewrap"><table className="grid ledger-grid"><thead><tr><th>NGÀY</th><th>KHÁCH HÀNG</th><th>NVKD PHỤ TRÁCH</th><th>BOOKING</th><th>LOẠI</th><th>SỐ TIỀN</th><th>CHỨNG TỪ</th><th>DIỄN GIẢI</th><th>NGƯỜI GHI</th></tr></thead>
        <tbody>{data?.entries.map((entry) => <tr key={entry.id}><td>{dateLabel(entry.occurredAt)}</td><td><b>{entry.customerName}</b></td><td>{entry.salesRepName ?? "Chưa phân công"}</td><td>{entry.bookingNo ?? "—"}</td><td><span className={`ledger-badge ${entry.entryType === "CHARGE" ? "charge" : "payment"}`}>{entry.entryType === "CHARGE" ? "Phải thu" : "Đã thu"}</span></td><td className="ledger-amount">{formatVnd(entry.amountVnd)}</td><td>{entry.referenceNo || "—"}</td><td className="ledger-note-cell">{entry.note || "—"}</td><td>{entry.createdByName || "—"}</td></tr>)}</tbody></table>
        {!data?.entries.length && <div className="empty">Không có giao dịch trong khoảng ngày này.</div>}
      </div>
    </section>
  </div>;
}
