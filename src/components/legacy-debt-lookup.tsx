"use client";

import { useEffect, useMemo, useState } from "react";

type DebtRow = {
  observationId: string; month: string; segment: "DA" | "DC"; sourceName: string; sourceProjectName: string | null;
  sourceAddress: string | null; sourcePhone: string | null; sourceCustomerCode: string | null; salesPerson: string | null;
  openingRaw: string | null; openingValue: string | null; revenueRaw: string | null; revenueValue: string | null;
  receiptsRaw: string | null; receiptsValue: string | null; closingRaw: string | null; closingValue: string | null;
  openingCell: string | null; revenueCell: string | null; receiptsCell: string | null; closingCell: string | null; residual: string | null;
  reconciliationStatus: string; unitStatus: string; identityKeyQuality: string; reviewStatus: string;
  sourceFile: string; sourceSha256: string; sourceSheet: string; sourceRow: number; sourceRange: string | null; rosterId: string | null;
};
type SalesPerson = { id: string; name: string; segment: string };
type ResponseData = { rows: DebtRow[]; total: number; page: number; pageSize: number; salesPeople: SalesPerson[] };

function sourceValue(raw: string | null, parsed: string | null) {
  if (raw !== null && raw !== "") return raw;
  return parsed ?? "—";
}

export function LegacyDebtLookup({ role }: { role: "ADMIN" | "ACCOUNTANT" | "SALES" }) {
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [month, setMonth] = useState("");
  const [segment, setSegment] = useState("");
  const [rosterId, setRosterId] = useState("");
  const [data, setData] = useState<ResponseData>({ rows: [], total: 0, page: 1, pageSize: 50, salesPeople: [] });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(page) });
    if (appliedQuery) search.set("q", appliedQuery);
    if (month) search.set("month", month);
    if (segment) search.set("segment", segment);
    if (rosterId) search.set("rosterId", rosterId);
    return search;
  }, [appliedQuery, month, page, rosterId, segment]);

  useEffect(() => {
    let current = true;
    void Promise.resolve().then(() => fetch(`/api/legacy/debt?${params.toString()}`, { cache: "no-store" }))
      .then(async (response) => {
        const body = await response.json().catch(() => ({})) as ResponseData & { error?: string };
        if (!response.ok) throw new Error(body.error || "Không tải được dữ liệu công nợ lịch sử.");
        if (current) { setData(body); setError(""); }
      }).catch((caught: unknown) => { if (current) setError(caught instanceof Error ? caught.message : "Không tải được dữ liệu."); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [params]);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPage(1); setAppliedQuery(query.trim());
  }
  function exportXlsx() {
    const exportParams = new URLSearchParams(params);
    exportParams.delete("page");
    const link = document.createElement("a");
    link.href = `/api/legacy/debt/export?${exportParams.toString()}`;
    link.download = "cencom-cong-no-lich-su.xlsx";
    document.body.append(link);
    link.click();
    link.remove();
  }

  return <>
    <div className="pagehead"><div><div className="eyebrow">BÁO CÁO KDBT · THÁNG 01–09/2026</div><h1>Tra cứu khách hàng & công nợ lịch sử</h1><div className="sub">Tra theo tên khách hàng, dự án, mã, địa chỉ hoặc NVKD; kết quả giữ liên kết về ô Excel gốc.</div></div><button className="btn" type="button" disabled={!data.total || loading} onClick={exportXlsx}>Xuất XLSX</button></div>
    <div className="notice"><b>Dữ liệu thẩm tra:</b> số tiền giữ nguyên đơn vị và cách ghi trong file nguồn; đơn vị tiền chưa xác nhận. Snapshot này không phải sổ cái công nợ vận hành và không tạo phiếu thu/bán hàng.</div>
    <form className="filter-row" onSubmit={submit}>
      <div className="field"><label htmlFor="legacy-query">Tìm khách hàng / dự án / mã / địa chỉ / NVKD</label><input id="legacy-query" value={query} onChange={(event) => setQuery(event.target.value)} maxLength={120} placeholder="Nhập từ khóa" /></div>
      <div className="field"><label htmlFor="legacy-month">Kỳ báo cáo</label><select id="legacy-month" value={month} onChange={(event) => { setMonth(event.target.value); setPage(1); }}><option value="">Tất cả tháng</option>{Array.from({ length: 9 }, (_, index) => `2026-${String(index + 1).padStart(2, "0")}`).map((value) => <option key={value} value={value}>{value}</option>)}</select></div>
      <div className="field"><label htmlFor="legacy-segment">Phân hệ</label><select id="legacy-segment" value={segment} onChange={(event) => { setSegment(event.target.value); setPage(1); }}><option value="">DA + DC</option><option value="DA">Dự án (DA)</option><option value="DC">Dân cư (DC)</option></select></div>
      <div className="field"><label htmlFor="legacy-sales">NVKD theo roster</label><select id="legacy-sales" value={rosterId} onChange={(event) => { setRosterId(event.target.value); setPage(1); }}><option value="">Tất cả NVKD được phép xem</option>{data.salesPeople.map((person) => <option key={person.id} value={person.id}>{person.name} · {person.segment}</option>)}</select></div>
      <button className="btn secondary" type="submit">Tìm kiếm</button>
    </form>
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="sub" aria-live="polite">{loading ? "Đang tìm…" : `${data.total.toLocaleString("vi-VN")} dòng nguồn · trang ${data.page}`}</div>
    <div className="tablewrap"><table className="grid"><thead><tr><th>KỲ / PHÂN HỆ</th><th>KHÁCH HÀNG / DỰ ÁN</th><th>ĐỊA CHỈ / ĐIỆN THOẠI</th><th>NVKD</th><th>DƯ ĐẦU KỲ</th><th>DOANH THU</th><th>THANH TOÁN</th><th>DƯ CUỐI KỲ</th><th>KIỂM TRA</th><th>NGUỒN EXCEL</th></tr></thead><tbody>
      {data.rows.map((row) => <tr key={row.observationId}>
        <td>{row.month.slice(0, 7)}<small>{row.segment}</small></td>
        <td><b>{row.sourceName}</b>{row.sourceProjectName && <small>{row.sourceProjectName}</small>}{row.sourceCustomerCode && <small>Mã: {row.sourceCustomerCode}</small>}</td>
        <td>{row.sourceAddress || "—"}{row.sourcePhone && <small>{row.sourcePhone}</small>}</td>
        <td>{row.salesPerson || "—"}</td>
        <td>{sourceValue(row.openingRaw, row.openingValue)}<small>{row.openingCell || "ô chưa xác định"}</small></td>
        <td>{sourceValue(row.revenueRaw, row.revenueValue)}<small>{row.revenueCell || "ô chưa xác định"}</small></td>
        <td>{sourceValue(row.receiptsRaw, row.receiptsValue)}<small>{row.receiptsCell || "ô chưa xác định"}</small></td>
        <td>{sourceValue(row.closingRaw, row.closingValue)}<small>{row.closingCell || "ô chưa xác định"}</small></td>
        <td><small>{row.reconciliationStatus}</small><small>{row.unitStatus}</small><small>{row.identityKeyQuality}</small><small>{row.reviewStatus}</small></td>
        <td><small>{row.sourceFile}</small><small>{row.sourceSheet} · hàng {row.sourceRow}{row.sourceRange ? ` · ${row.sourceRange}` : ""}</small><small>SHA-256: {row.sourceSha256.slice(0, 12)}…</small></td>
      </tr>)}
    </tbody></table>{!loading && data.rows.length === 0 && <div className="empty">Chưa có dữ liệu hoặc không có dòng khớp bộ lọc.</div>}</div>
    <div className="modalfoot"><button className="btn secondary" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Trang trước</button><span>{data.total ? `${((page - 1) * data.pageSize + 1).toLocaleString("vi-VN")}–${Math.min(page * data.pageSize, data.total).toLocaleString("vi-VN")}` : "0"} / {data.total.toLocaleString("vi-VN")}</span><button className="btn secondary" type="button" disabled={page * data.pageSize >= data.total || loading} onClick={() => setPage((current) => current + 1)}>Trang sau</button></div>
  </>;
}
