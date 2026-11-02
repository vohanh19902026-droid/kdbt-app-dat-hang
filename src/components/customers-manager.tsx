"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Download, FileSpreadsheet, Pencil, Plus, Search, Upload, Users } from "lucide-react";
import { normalizeCustomerDuplicateKey, parseCustomerCsv, type CustomerCsvError, type CustomerCsvRow } from "@/lib/customer-csv";

type Customer = { id: string; name: string; phone: string | null; defaultAddress: string | null;
  salesRepId: string | null; salesRepName: string | null; isActive: boolean; createdAt: string };
type SalesUser = { id: string; name: string; email: string; employeeCode: string | null; isActive: boolean };
type FormValue = { name: string; phone: string; defaultAddress: string; salesRepId: string; isActive: boolean };
type ImportRow = CustomerCsvRow & { salesRepId: string | null; salesRepName: string; error: string; duplicate: boolean };
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
  const [importOpen, setImportOpen] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importErrors, setImportErrors] = useState<CustomerCsvError[]>([]);
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [importBusy, setImportBusy] = useState(false);
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
  function startImport() {
    setImportRows([]); setImportErrors([]); setImportError(""); setImportSuccess(""); setImportOpen(true);
  }
  function downloadTemplate() {
    const content = "\uFEFFTên khách hàng,Số điện thoại,Địa chỉ mặc định,Email NVKD,Mã NVKD\r\n";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "mau-import-khach-hang.csv";
    anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
  async function readImportFile(file?: File) {
    setImportRows([]); setImportErrors([]); setImportError("");
    if (!file) return;
    if (file.size > 2_000_000) { setImportError("Tệp tối đa 2 MB. Hãy chia danh sách thành các tệp nhỏ hơn."); return; }
    let text: string;
    try { text = await file.text(); }
    catch { setImportError("Không đọc được tệp. Hãy lưu lại dưới định dạng CSV UTF-8 rồi thử lại."); return; }
    const parsed = parseCustomerCsv(text);
    setImportErrors(parsed.errors);
    const activeSalesUsers = salesUsers.filter((salesUser) => salesUser.isActive);
    const byEmail = new Map(activeSalesUsers.map((salesUser) => [salesUser.email.trim().toLocaleLowerCase("vi"), salesUser]));
    const byCode = new Map(activeSalesUsers.filter((salesUser) => salesUser.employeeCode)
      .map((salesUser) => [salesUser.employeeCode!.trim().toLocaleLowerCase("vi"), salesUser]));
    const seen = new Set<string>();
    const existing = new Set(customers.map(normalizeCustomerDuplicateKey));
    setImportRows(parsed.rows.map((row) => {
      const emailUser = row.salesRepEmail ? byEmail.get(row.salesRepEmail.toLocaleLowerCase("vi")) : undefined;
      const codeUser = row.employeeCode ? byCode.get(row.employeeCode.toLocaleLowerCase("vi")) : undefined;
      let error = "";
      if (row.salesRepEmail && !emailUser) error = "Không tìm thấy email NVKD đang hoạt động.";
      else if (row.employeeCode && !codeUser) error = "Không tìm thấy mã NVKD đang hoạt động.";
      else if (emailUser && codeUser && emailUser.id !== codeUser.id) error = "Email và mã NVKD thuộc hai tài khoản khác nhau.";
      const salesRep = emailUser || codeUser;
      if (!error && !salesRep) error = "Cần giao khách hàng cho một NVKD đang hoạt động.";
      const duplicateKey = normalizeCustomerDuplicateKey(row);
      const duplicate = !error && (existing.has(duplicateKey) || seen.has(duplicateKey));
      if (!error) seen.add(duplicateKey);
      return { ...row, salesRepId: salesRep?.id || null, salesRepName: salesRep?.name || "—", error, duplicate };
    }));
  }
  async function importCustomers() {
    const ready = importRows.filter((row) => !row.error && !row.duplicate && row.salesRepId);
    if (!ready.length || importErrors.length || importRows.some((row) => row.error)) return;
    setImportBusy(true); setImportError("");
    try {
      const response = await fetch("/api/customers/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customers: ready.map(({ rowNumber, name, phone, defaultAddress, salesRepId }) => ({
          rowNumber, name, phone: phone || null, defaultAddress: defaultAddress || null, salesRepId,
        })) }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { setImportError(result.error || "Không nhập được danh sách. Vui lòng kiểm tra lại tệp."); return; }
      const skipped = importRows.length - ready.length;
      setImportSuccess(`Đã nhập ${result.imported} khách hàng${skipped ? `; bỏ qua ${skipped} dòng trùng` : ""}.`);
      setImportOpen(false); router.refresh();
    } catch {
      setImportError("Mất kết nối tới máy chủ. Kiểm tra mạng rồi thử lại.");
    } finally {
      setImportBusy(false);
    }
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
      {canManage && <div className="heading-actions"><button className="btn secondary" type="button" onClick={startImport}><Upload size={16} /> Nhập CSV</button><button className="btn" type="button" onClick={startCreate}><Plus size={16} /> Thêm khách hàng</button></div>}
    </div>
    <div className="stats customer-stats">
      <div className="stat"><div className="stathead"><span>Tổng khách hàng</span><Building2 size={16} /></div><strong>{customers.length}</strong><small>Hồ sơ trong danh mục</small></div>
      <div className="stat"><div className="stathead"><span>Đang hoạt động</span><Users size={16} /></div><strong>{active}</strong><small>Có thể chọn khi tạo booking</small></div>
      <div className="stat"><div className="stathead"><span>Đã giao NVKD</span><Users size={16} /></div><strong>{owned}</strong><small>Trách nhiệm thu hồi công nợ đã rõ</small></div>
    </div>
    {!canManage && <div className="notice">Bạn đang ở chế độ chỉ xem. Admin quản lý hồ sơ và phân công NVKD tại đây.</div>}
    {importSuccess && <div className="notice customer-import-success" role="status">{importSuccess}</div>}
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
    {canManage && importOpen && <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget && !importBusy) setImportOpen(false); }}>
      <section className="modal customer-import-modal" role="dialog" aria-modal="true" aria-labelledby="customer-import-title">
        <div className="modalhead"><div><div className="eyebrow">NẠP DỮ LIỆU BAN ĐẦU</div><h2 id="customer-import-title">Nhập danh sách khách hàng</h2>
          <div className="sub">Chọn tệp CSV UTF-8, tối đa 200 khách/lần. Mỗi khách cần có email hoặc mã NVKD đang hoạt động.</div></div>
          <button type="button" className="close" onClick={() => setImportOpen(false)} aria-label="Đóng" disabled={importBusy}>×</button></div>
        <div className="customer-import-tools"><button className="btn secondary" type="button" onClick={downloadTemplate}><Download size={15} /> Tải mẫu CSV</button>
          <label className="btn secondary customer-import-file"><FileSpreadsheet size={15} /> Chọn tệp CSV<input type="file" accept=".csv,text/csv" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; void readImportFile(file); }} /></label></div>
        {importError && <div className="form-error" role="alert">{importError}</div>}
        {importErrors.length > 0 && <div className="customer-import-errors" role="alert">{importErrors.map((item, index) => <div key={`${item.rowNumber}-${index}`}>{item.rowNumber ? `Dòng ${item.rowNumber}: ` : "Tệp: "}{item.message}</div>)}</div>}
        {importRows.length > 0 && <>
          <div className="customer-import-summary">{importRows.filter((row) => !row.error && !row.duplicate).length} dòng sẵn sàng · {importRows.filter((row) => row.duplicate).length} dòng trùng sẽ bỏ qua · {importRows.filter((row) => row.error).length} lỗi</div>
          <div className="customer-import-preview"><table><thead><tr><th>DÒNG</th><th>KHÁCH HÀNG</th><th>ĐIỆN THOẠI</th><th>ĐỊA CHỈ</th><th>NVKD</th><th>KIỂM TRA</th></tr></thead>
            <tbody>{importRows.map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.name}</td><td>{row.phone || "—"}</td><td>{row.defaultAddress || "—"}</td><td>{row.salesRepName}</td><td>{row.error ? <span className="customer-import-error">{row.error}</span> : row.duplicate ? <span className="customer-import-duplicate">Đã có, bỏ qua</span> : <span className="customer-import-ready">Sẵn sàng</span>}</td></tr>)}</tbody></table></div>
        </>}
        <div className="modalfoot"><button type="button" className="btn secondary" disabled={importBusy} onClick={() => setImportOpen(false)}>Đóng</button>
          <button type="button" className="btn" disabled={importBusy || !importRows.some((row) => !row.error && !row.duplicate) || importErrors.length > 0 || importRows.some((row) => row.error)} onClick={() => void importCustomers()}>
            {importBusy ? "Đang nhập…" : `Nhập ${importRows.filter((row) => !row.error && !row.duplicate).length} khách hàng`}
          </button></div>
      </section>
    </div>}
  </>;
}
