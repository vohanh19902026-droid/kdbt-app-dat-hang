import { TechnicalCatalog } from "@/components/technical-catalog";
import { getAppSettings } from "@/lib/app-settings";
import { requireSession } from "@/lib/session";

export const runtime = "nodejs";

export default async function TechnicalCatalogPage() {
  await requireSession(["ADMIN", "TECHNICAL"]);
  const settings = await getAppSettings();
  return <><div className="pagehead"><div><div className="eyebrow">KỸ THUẬT · QUẢN LÝ LỰA CHỌN SẢN PHẨM</div><h1>Danh mục kỹ thuật</h1><div className="sub">Thêm, ngừng dùng hoặc khôi phục lựa chọn; mục đã dùng không thể xóa khỏi lịch sử.</div></div></div><TechnicalCatalog initialCatalog={settings.catalog} initialArchived={settings.catalogArchived} /></>;
}
