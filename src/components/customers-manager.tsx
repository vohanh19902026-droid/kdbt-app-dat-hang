"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Plus, Search, Users } from "lucide-react";

type Customer = { id: string; name: string; phone: string | null; defaultAddress: string | null;
  salesRepId: string | null; salesRepName: string | null; isActive: boolean; createdAt: string };
type SalesUser = { id: string; name: string; employeeCode: string | null; isActive: boolean };
type FormValue = { name: string; phone: string; defaultAddress: string; salesRepId: string; isActive: boolean };
const blank: FormValue = { name: "", phone: "", defaultAddress: "", salesRepId: "", isActive: true };

export function CustomersManager({ customers, salesUsers, canManage }: {
  customers: Customer[]; salesUsers: SalesUser[]; canManage: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<FormValue>(blank);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    return query ? customers.filter((customer) => [customer.name, customer.phone, customer.defaultAddress, customer.salesRepName]
      .some((part) => part?.toLocaleLowerCase("vi").includes(query))) : customers;
  }, [customers, search]);
  const owned = customers.filter((customer) => customer.salesRepId).length;
  const active = customers.filter((customer) => customer.isActive).length;

  function startCreate() {
    setEditing(null); setValue(blank); setError(""); setOpen(true);
  }
  function startEdit(customer: Customer) {
    setEditing(customer);
    setValue({ name: customer.name, phone: customer.phone || "", defaultAddress: customer.defaultAddress || "",
      salesRepId: customer.salesRepId || "", isActive: customer.isActive });
    setError(""); setOpen(true);
  }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/customers", {
        method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editing ? { customerId: editing.id, isActive: value.isActive } : {}),
          name: value.name, phone: value.phone || null, defaultAddress: value.defaultAddress || null,
          salesRepId: value.salesRepId || null }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setError(result.error || "Không lưu được khách hàng. Vui lòng thử lại."); return; }
      setOpen(false); router.refresh();
    } catch {
      setError("Mất kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="pagehead"><div><div className="eyebrow">DANH MỤC DỮ LIỆU</div><h1>Khách hàng</h1>
      <div className="sub">Hồ sơ khách hàng và nhân viên kinh doanh chịu trách nhiệm chăm sóc, thu hồi công nợ.</div></div>
      {canManage && <button className="btn" type="button" onClick={startCreate}><Plus size={16} /> Thêm khách hàng</button>}
    </div>
    <div className="stats customer-stats">
      <div className="stat"><div className="stathead"><span>Tổng khách hàng</span><Building2 size={16} /></div><strong>{customers.length}</strong><small>Hồ sơ trong danh mục</small></div>
      <div className="stat"><div className="stathead"><span>Đang hoạt động</span><Users size={16} /></div><strong>{active}</strong><small>Có thể chọn khi tạo booking</small></div>
      <div className="stat"><div className="stathead"><span>Đã giao NVKD</span><Users size={16} /></div><strong>{owned}</strong><small>Trách nhiệm thu hồi công nợ đã rõ</small></div>
    </div>
    {!canManage && <div className="notice">Bạn đang ở chế độ chỉ xem. Admin quản lý hồ sơ và phân công NVKD tại đây.</div>}
    <div className="toolbar customer-toolbar"><label className="customer-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên, số điện thoại, địa chỉ hoặc NVKD" /></label>
      <span className="muted">{filtered.length} khách hàng</span></div>
    <div className="tablewrap"><table className="grid customer-grid"><thead><tr><th>KHÁCH HÀNG</th><th>ĐIỆN THOẠI</th><th>ĐỊA CHỈ MẶC ĐỊNH</th><th>NHÂN VIÊN KINH DOANH</th><th>TRẠNG THÁI</th>{canManage && <th>THAO TÁC</th>}</tr></thead>
      <tbody>{filtered.map((customer) => <tr key={customer.id}><td><b>{customer.name}</b></td><td>{customer.phone || "—"}</td><td>{customer.defaultAddress || "—"}</td>
        <td>{customer.salesRepName || <span className="muted">Chưa phân công</span>}</td><td><span className={`customer-state ${customer.isActive ? "is-active" : "is-paused"}`}>{customer.isActive ? "Đang hoạt động" : "Đã ngừng"}</span></td>
        {canManage && <td><button className="btn secondary customer-edit" type="button" onClick={() => startEdit(customer)}><Pencil size={14} /> Sửa / giao NVKD</button></td>}</tr>)}</tbody>
    </table>{filtered.length === 0 && <div className="empty">{customers.length === 0 ? "Chưa có khách hàng. Admin có thể tạo hồ sơ và giao NVKD trước khi phát sinh đơn hàng." : "Không tìm thấy khách hàng phù hợp."}</div>}</div>
    {canManage && open && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}>
      <section className="modal customer-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
        <div className="modalhead"><div><div className="eyebrow">HỒ SƠ KHÁCH HÀNG</div><h2 id="customer-modal-title">{editing ? "Cập nhật khách hàng" : "Thêm khách hàng"}</h2>
          <div className="sub">Giao khách hàng cho NVKD để xác định người chịu trách nhiệm thu hồi công nợ.</div></div>
          <button type="button" className="close" onClick={() => setOpen(false)} aria-label="Đóng" disabled={busy}>×</button></div>
        <form onSubmit={save}><div className="formgrid">
          <div className="field full"><label htmlFor="customer-name">Tên khách hàng *</label><input id="customer-name" autoFocus required minLength={2} maxLength={180} value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} /></div>
          <div className="field"><label htmlFor="customer-phone">Số điện thoại</label><input id="customer-phone" type="tel" maxLength={40} value={value.phone} onChange={(event) => setValue({ ...value, phone: event.target.value })} /></div>
          <div className="field"><label htmlFor="customer-owner">NVKD phụ trách</label><select id="customer-owner" value={value.salesRepId} onChange={(event) => setValue({ ...value, salesRepId: event.target.value })}>
            <option value="">Chưa phân công</option>{salesUsers.map((salesUser) => <option key={salesUser.id} value={salesUser.id} disabled={!salesUser.isActive}>{salesUser.name}{salesUser.employeeCode ? ` · ${salesUser.employeeCode}` : ""}{salesUser.isActive ? "" : " · đã khóa"}</option>)}
          </select><small className="muted">Chỉ tài khoản NVKD đang hoạt động nhận khách.</small></div>
          <div className="field full"><label htmlFor="customer-address">Địa chỉ mặc định</label><textarea id="customer-address" maxLength={500} value={value.defaultAddress} onChange={(event) => setValue({ ...value, defaultAddress: event.target.value })} /></div>
          {editing && <label className="customer-active"><input type="checkbox" checked={value.isActive} onChange={(event) => setValue({ ...value, isActive: event.target.checked })} /> Khách hàng đang hoạt động</label>}
        </div>
        {error && <div className="form-error" role="alert">{error}</div>}
        <div className="modalfoot"><button type="button" className="btn secondary" disabled={busy} onClick={() => setOpen(false)}>Hủy</button><button type="submit" className="btn" disabled={busy}>{busy ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Tạo khách hàng"}</button></div>
        </form>
      </section>
    </div>}
  </>;
}
