import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/session";
import { createCustomerImportTemplate } from "@/lib/customer-workbook";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.appRole !== "ADMIN") return NextResponse.json({ error: "Chỉ Admin được tải mẫu nhập khách hàng." }, { status: 403 });
  const workbook = createCustomerImportTemplate();
  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(new Uint8Array(buffer), { headers: {
    "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "Content-Disposition": "attachment; filename=cencom-mau-nhap-khach-hang.xlsx",
    "Cache-Control": "no-store",
  } });
}
