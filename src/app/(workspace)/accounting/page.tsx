import { requireSession } from "@/lib/session";

export default async function AccountingPage() {
  await requireSession(["ADMIN", "ACCOUNTANT"]);
  return <><div className="pagehead"><div><div className="eyebrow">PHÂN HỆ MỞ RỘNG</div><h1>Công nợ khách hàng</h1><div className="sub">Phân hệ kế toán sẽ được bổ sung sau khi thống nhất quy trình ghi nhận giao hàng và đối soát.</div></div></div>
    <div className="notice">Kế hoạch tiếp theo: chi tiết khối lượng từng chuyến, phiếu giao hàng, đối soát với khách hàng, hóa đơn và thu tiền.</div>
  </>;
}