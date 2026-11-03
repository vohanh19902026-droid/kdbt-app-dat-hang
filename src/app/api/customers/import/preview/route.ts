import { NextRequest, NextResponse } from "next/server";
import { getApiSession } from "@/lib/session";
import { isCrossOriginRequest } from "@/lib/request-guard";
import { parseCustomerWorkbook } from "@/lib/customer-workbook";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (isCrossOriginRequest(request)) return NextResponse.json({ error: "Yêu cầu không hợp lệ." }, { status: 403 });
  const session = await getApiSession(request.headers);
  if (!session) return NextResponse.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (session.appRole !== "ADMIN") return NextResponse.json({ error: "Chỉ Admin được nhập danh sách khách hàng." }, { status: 403 });
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Vui lòng chọn tệp XLSX." }, { status: 400 });
  if (!file.name.toLocaleLowerCase("vi").endsWith(".xlsx")) return NextResponse.json({ error: "Chỉ nhận tệp Excel XLSX." }, { status: 400 });
  if (file.size === 0 || file.size > 2_000_000) return NextResponse.json({ error: "Tệp XLSX phải có dung lượng từ 1 byte đến 2 MB." }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.subarray(0, 2).toString("hex") !== "504b") return NextResponse.json({ error: "Tệp không đúng định dạng XLSX." }, { status: 400 });
  try {
    const parsed = await parseCustomerWorkbook(bytes);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: "Tệp XLSX bị lỗi hoặc không đúng cấu trúc. Hãy tải mẫu CENCOM rồi thử lại." }, { status: 400 });
  }
}
