import ExcelJS from "exceljs";

type LegacyRow = {
  month: string;
  segment: string;
  sourceName: string;
  sourceProjectName: string | null;
  sourceAddress: string | null;
  sourcePhone: string | null;
  sourceCustomerCode: string | null;
  salesPerson: string | null;
  openingRaw: string | null;
  openingValue: string | null;
  revenueRaw: string | null;
  revenueValue: string | null;
  receiptsRaw: string | null;
  receiptsValue: string | null;
  closingRaw: string | null;
  closingValue: string | null;
  residual: string | null;
  reconciliationStatus: string;
  unitStatus: string;
  identityKeyQuality: string;
  reviewStatus: string;
  sourceFile: string;
  sourceSha256: string;
  sourceSheet: string;
  sourceRow: number;
  sourceRange: string | null;
  openingCell: string | null;
  revenueCell: string | null;
  receiptsCell: string | null;
  closingCell: string | null;
};

const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF164E3B" } };

export function createLegacyDebtWorkbook(rows: LegacyRow[], filters: { query: string; month: string | null; segment: string | null }) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CENCOM";
  workbook.subject = "Tra cứu snapshot công nợ từ báo cáo KDBT";
  workbook.created = new Date();

  const guide = workbook.addWorksheet("Hướng dẫn");
  guide.columns = [{ width: 28 }, { width: 115 }];
  const guideRows = [
    ["CENCOM | Công nợ lịch sử KDBT", ""],
    ["Trạng thái", "Dữ liệu trích từ báo cáo tháng, đang chờ kế toán/kinh doanh thẩm tra; không phải sổ cái đã duyệt."],
    ["Đơn vị", "Giữ nguyên đơn vị thể hiện trong nguồn. Chưa quy đổi sang VND vì đơn vị tiền của các cột chưa được xác nhận."],
    ["Nguồn", "Mỗi dòng ghi tên workbook, SHA-256, sheet, số hàng và ô nguồn để người rà soát mở lại Excel đối chiếu."],
    ["Cân đối", "Trạng thái cân đối được giữ như bộ staging; không tự sửa, gộp khách hàng, hoặc coi số thanh toán là phiếu thu."],
    ["Tách sổ", "Snapshot lịch sử được lưu riêng; không tạo khách hàng vận hành, giao dịch bán hàng hoặc bút toán trong receivable_entries."],
    ["Bộ lọc", `Từ khóa: ${filters.query || "(tất cả)"}; kỳ: ${filters.month || "(tất cả)"}; phân hệ: ${filters.segment || "(tất cả)"}.`],
    ["Số dòng", String(rows.length)],
  ];
  guide.addRows(guideRows);
  guide.mergeCells("A1:B1");
  guide.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  guide.getCell("A1").fill = headerFill;
  guide.getCell("A1").alignment = { vertical: "middle" };
  guide.getColumn(1).font = { bold: true, color: { argb: "FF263238" } };
  guide.getColumn(2).alignment = { wrapText: true, vertical: "top" };
  guide.getRow(1).height = 30;
  for (let index = 2; index <= guideRows.length; index += 1) guide.getRow(index).height = 34;

  const sheet = workbook.addWorksheet("Tra cứu công nợ", {
    properties: { defaultRowHeight: 22 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [
    { header: "Kỳ báo cáo", key: "month", width: 14 },
    { header: "Phân hệ", key: "segment", width: 12 },
    { header: "Khách hàng nguồn", key: "sourceName", width: 32 },
    { header: "Dự án / công trình", key: "sourceProjectName", width: 34 },
    { header: "Địa chỉ nguồn", key: "sourceAddress", width: 38 },
    { header: "Điện thoại nguồn", key: "sourcePhone", width: 18 },
    { header: "Mã khách hàng", key: "sourceCustomerCode", width: 18 },
    { header: "NVKD nguồn", key: "salesPerson", width: 24 },
    { header: "Dư đầu kỳ (nguồn)", key: "openingRaw", width: 22 },
    { header: "Doanh thu (nguồn)", key: "revenueRaw", width: 22 },
    { header: "Thanh toán (nguồn)", key: "receiptsRaw", width: 22 },
    { header: "Dư cuối kỳ (nguồn)", key: "closingRaw", width: 22 },
    { header: "Cân đối", key: "reconciliationStatus", width: 22 },
    { header: "Đơn vị", key: "unitStatus", width: 24 },
    { header: "Chất lượng khóa", key: "identityKeyQuality", width: 24 },
    { header: "Trạng thái rà soát", key: "reviewStatus", width: 24 },
    { header: "Workbook", key: "sourceFile", width: 44 },
    { header: "SHA-256", key: "sourceSha256", width: 66 },
    { header: "Sheet", key: "sourceSheet", width: 18 },
    { header: "Hàng", key: "sourceRow", width: 10 },
    { header: "Vùng nguồn", key: "sourceRange", width: 22 },
    { header: "Ô dư đầu", key: "openingCell", width: 12 },
    { header: "Ô doanh thu", key: "revenueCell", width: 14 },
    { header: "Ô thanh toán", key: "receiptsCell", width: 14 },
    { header: "Ô dư cuối", key: "closingCell", width: 12 },
  ];
  const header = sheet.getRow(1);
  header.height = 34;
  header.eachCell((cell) => { cell.fill = headerFill; cell.font = { bold: true, color: { argb: "FFFFFFFF" } }; cell.alignment = { wrapText: true, vertical: "middle" }; });
  sheet.addRows(rows.map((row) => ({
    ...row,
    month: row.month.slice(0, 7),
    openingRaw: row.openingRaw ?? row.openingValue,
    revenueRaw: row.revenueRaw ?? row.revenueValue,
    receiptsRaw: row.receiptsRaw ?? row.receiptsValue,
    closingRaw: row.closingRaw ?? row.closingValue,
  })));
  sheet.autoFilter = { from: "A1", to: "Y1" };
  sheet.views = [{ state: "frozen", ySplit: 1 }];
  sheet.eachRow((row, rowNumber) => { if (rowNumber > 1) row.alignment = { vertical: "top", wrapText: false }; });
  return workbook;
}
