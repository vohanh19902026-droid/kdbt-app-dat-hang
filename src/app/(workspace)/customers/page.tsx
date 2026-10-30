import { asc } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";
export default async function CustomersPage() {
  await requireSession(["ADMIN", "PLANNER"]);
  const rows = await db.select().from(customers).orderBy(asc(customers.name));
  return <><div className="pagehead"><div><div className="eyebrow">DANH MỤC DỮ LIỆU</div><h1>Khách hàng</h1><div className="sub">Thông tin khách hàng được ghi nhận khi phát sinh booking.</div></div></div>
    <div className="tablewrap"><table className="grid"><thead><tr><th>KHÁCH HÀNG</th><th>ĐIỆN THOẠI</th><th>ĐỊA CHỈ MẶC ĐỊNH</th><th>TRẠNG THÁI</th></tr></thead><tbody>
      {rows.map((customer) => <tr key={customer.id}><td>{customer.name}</td><td>{customer.phone || "—"}</td><td>{customer.defaultAddress || "—"}</td><td>{customer.isActive ? "Đang hoạt động" : "Ngừng"}</td></tr>)}
    </tbody></table>{rows.length === 0 && <div className="empty">Danh mục sẽ tự tạo khi nhận đơn đầu tiên.</div>}</div>
  </>;
}