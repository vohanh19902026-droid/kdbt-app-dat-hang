import { and, asc, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireSession } from "@/lib/session";
import { clampIsoDateRange, normalizeIsoDate, vnDateRange } from "@/lib/vn-date";

export const runtime = "nodejs";

const MAX_RANGE_DAYS = 92;

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ date?: string; from?: string; to?: string }> }) {
  await requireSession(["ADMIN", "PLANNER", "ACCOUNTANT"]);
  const params = await searchParams;
  const fallback = normalizeIsoDate(params.date);
  const requestedFrom = normalizeIsoDate(params.from ?? fallback);
  const requestedTo = normalizeIsoDate(params.to ?? requestedFrom);
  // Chặn khoảng quá lớn để một lần bấm lọc không kéo cả năm dữ liệu vào bộ nhớ.
  const range = clampIsoDateRange(requestedFrom, requestedTo, MAX_RANGE_DAYS);
  const fromDate = range.from;
  const endDate = range.to;
  const clamped = range.clamped;

  const from = vnDateRange(fromDate).from;
  const to = vnDateRange(endDate).to;
  const plannedAt = sql`COALESCE(${orders.plannedStartAt}, ${orders.requestedAt})`;
  const rows = await db.select().from(orders)
    .where(and(gte(plannedAt, from), lt(plannedAt, to)))
    .orderBy(asc(orders.customerName))
    .limit(5000);

  const groups = new Map<string, { sales: string; count: number; ordered: number; actual: number }>();
  for (const row of rows) {
    const group = groups.get(row.customerName) || { sales: row.salesRepName, count: 0, ordered: 0, actual: 0 };
    group.count += 1; group.ordered += Number(row.quantityM3); group.actual += Number(row.actualM3);
    groups.set(row.customerName, group);
  }
  const format = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
  const dateLabel = (value: string) => new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(`${value}T12:00:00+07:00`));
  const total = rows.reduce((sum, row) => sum + Number(row.quantityM3), 0);
  const actual = rows.reduce((sum, row) => sum + Number(row.actualM3), 0);
  const rangeLabel = fromDate === endDate ? dateLabel(fromDate) : `${dateLabel(fromDate)} → ${dateLabel(endDate)}`;
  return <><div className="pagehead"><div><div className="eyebrow">BÁO CÁO SẢN XUẤT</div><h1>Tổng hợp sản lượng</h1><div className="sub">Khối lượng đặt và thực đổ theo khách hàng · {rangeLabel}</div></div>
    <form className="filter-row">
      <label className="sub">Từ ngày <input className="date-input" name="from" type="date" defaultValue={fromDate} /></label>
      <label className="sub">Đến ngày <input className="date-input" name="to" type="date" defaultValue={endDate} /></label>
      <button className="btn secondary">Lọc khoảng</button>
    </form></div>
    {clamped && <div className="form-error" role="alert">Khoảng lọc tối đa {MAX_RANGE_DAYS} ngày. Đã tự giới hạn đến {dateLabel(endDate)}.</div>}
    <div className="stats">
      <div className="stat"><div className="stathead">Tổng khối lượng đặt</div><strong>{format(total)} <small>m³</small></strong><small>{rows.length} booking</small></div>
      <div className="stat"><div className="stathead">Tổng khối lượng thực đổ</div><strong>{format(actual)} <small>m³</small></strong><small>{total ? format(actual / total * 100) : 0}% so với khối lượng đặt</small></div>
      <div className="stat"><div className="stathead">Khách hàng</div><strong>{groups.size}</strong><small>Khách phát sinh đơn trong khoảng</small></div>
      <div className="stat"><div className="stathead">Đơn chưa hoàn tất</div><strong>{rows.filter((row) => !["COMPLETED", "CANCELLED"].includes(row.status)).length}</strong><small>Đang chờ hoặc đang cấp</small></div>
    </div>
    <div className="tablewrap"><table className="grid"><thead><tr><th>KHÁCH HÀNG / KINH DOANH</th><th>SỐ BOOKING</th><th>KL ĐẶT (m³)</th><th>KL THỰC ĐỔ (m³)</th><th>CHÊNH LỆCH (m³)</th></tr></thead>
      <tbody>{[...groups].map(([name, group]) => <tr key={name}><td><b>{name}</b><br /><span className="muted">Kinh doanh: {group.sales}</span></td><td>{group.count}</td><td>{format(group.ordered)}</td><td>{format(group.actual)}</td><td>{format(group.ordered - group.actual)}</td></tr>)}</tbody>
      <tfoot><tr><th>TỔNG</th><th>{rows.length}</th><th>{format(total)}</th><th>{format(actual)}</th><th>{format(total - actual)}</th></tr></tfoot></table>
      {!rows.length && <div className="empty">Chưa có booking trong khoảng ngày này.</div>}</div>
  </>;
}
