import { and, asc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const { appRole, user } = await requireSession(["ADMIN", "PLANNER", "ACCOUNTANT"]);
  const params = await searchParams;
  const date = params.date || new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const from = new Date(`${date}T00:00:00+07:00`);
  const to = new Date(from.getTime() + 86_400_000);
  const filters = [gte(orders.requestedAt, from), lt(orders.requestedAt, to)];
  if (appRole === "ACCOUNTANT") filters.push(eq(orders.createdBy, user.id));
  const rows = await db.select().from(orders).where(and(...filters)).orderBy(asc(orders.customerName));
  const groups = new Map<string, { sales: string; count: number; ordered: number; actual: number }>();
  for (const row of rows) {
    const group = groups.get(row.customerName) || { sales: row.salesRepName, count: 0, ordered: 0, actual: 0 };
    group.count += 1; group.ordered += Number(row.quantityM3); group.actual += Number(row.actualM3);
    groups.set(row.customerName, group);
  }
  const format = (value: number) => new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(value);
  const total = rows.reduce((sum, row) => sum + Number(row.quantityM3), 0);
  const actual = rows.reduce((sum, row) => sum + Number(row.actualM3), 0);
  return <><div className="pagehead"><div><div className="eyebrow">BÁO CÁO SẢN XUẤT</div><h1>Tổng hợp sản lượng</h1><div className="sub">Khối lượng đặt và thực đổ theo khách hàng trong ngày.</div></div>
    <form><input className="date-input" name="date" type="date" defaultValue={date} /><button className="btn secondary">Lọc ngày</button></form></div>
    <div className="stats">
      <div className="stat"><div className="stathead">Tổng khối lượng đặt</div><strong>{format(total)} <small>m³</small></strong><small>{rows.length} booking</small></div>
      <div className="stat"><div className="stathead">Tổng khối lượng thực đổ</div><strong>{format(actual)} <small>m³</small></strong><small>{total ? format(actual / total * 100) : 0}% so với khối lượng đặt</small></div>
      <div className="stat"><div className="stathead">Khách hàng</div><strong>{groups.size}</strong><small>Khách phát sinh đơn trong ngày</small></div>
      <div className="stat"><div className="stathead">Đơn chưa hoàn tất</div><strong>{rows.filter((row) => !["COMPLETED", "CANCELLED"].includes(row.status)).length}</strong><small>Đang chờ hoặc đang cấp</small></div>
    </div>
    <div className="tablewrap"><table className="grid"><thead><tr><th>KHÁCH HÀNG / KINH DOANH</th><th>SỐ BOOKING</th><th>KL ĐẶT (m³)</th><th>KL THỰC ĐỔ (m³)</th><th>CHÊNH LỆCH (m³)</th></tr></thead>
      <tbody>{[...groups].map(([name, group]) => <tr key={name}><td><b>{name}</b><br /><span className="muted">Kinh doanh: {group.sales}</span></td><td>{group.count}</td><td>{format(group.ordered)}</td><td>{format(group.actual)}</td><td>{format(group.ordered - group.actual)}</td></tr>)}</tbody>
      <tfoot><tr><th>TỔNG</th><th>{rows.length}</th><th>{format(total)}</th><th>{format(actual)}</th><th>{format(total - actual)}</th></tr></tfoot></table>
      {!rows.length && <div className="empty">Chưa có booking trong ngày này.</div>}</div>
  </>;
}