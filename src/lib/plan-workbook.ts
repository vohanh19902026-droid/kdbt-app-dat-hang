import ExcelJS from "exceljs";

export type PlanExportOrder = {
  bookingNo: string;
  customerName: string;
  siteAddress: string;
  salesRepName: string;
  contactPhone: string | null;
  plannedStartAt: Date | null;
  plannedEndAt: Date | null;
  quantityM3: string;
  actualM3: string;
  grade: string;
  sandType: string;
  stoneType: string;
  pumpOperator: string | null;
  assignedVehicle: string | null;
  truckCapacityM3: string | null;
  pourType: string | null;
  salesNote: string | null;
  planningNote: string | null;
  status: string;
};

const columns = [
  { header: "STT", key: "no", width: 5 },
  { header: "Xuất phát", key: "start", width: 10 },
  { header: "TG đổ", key: "end", width: 9 },
  { header: "Mã đơn", key: "booking", width: 15 },
  { header: "Khách hàng", key: "customer", width: 24 },
  { header: "Địa chỉ liên hệ", key: "address", width: 27 },
  { header: "Kinh doanh", key: "sales", width: 14 },
  { header: "Điện thoại", key: "phone", width: 15 },
  { header: "KL đặt", key: "qty", width: 9 },
  { header: "KL thực đổ", key: "actual", width: 10 },
  { header: "Mác", key: "grade", width: 15 },
  { header: "Cốt liệu T I", key: "sand", width: 16 },
  { header: "Cốt liệu T II", key: "stone", width: 16 },
  { header: "Nhân viên bơm", key: "pumpOperator", width: 17 },
  { header: "Phương tiện", key: "vehicle", width: 18 },
  { header: "Xe chở / chuyến", key: "capacity", width: 15 },
  { header: "HM", key: "pourType", width: 12 },
  { header: "Ghi chú", key: "note", width: 22 },
];

const timeVN = (value: Date | null) => value
  ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh", hour12: false }).format(value)
  : "";

export function createPlanWorkbook(date: string, from: Date, rows: PlanExportOrder[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CENCOM";
  workbook.subject = "Kế hoạch cấp bê tông";
  workbook.title = `Kế hoạch cấp bê tông ${date}`;
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Kế hoạch cấp", {
    views: [{ state: "frozen", ySplit: 6, activeCell: "A7" }],
    pageSetup: {
      paperSize: 8 as ExcelJS.PaperSize, orientation: "landscape", fitToPage: true,
      fitToWidth: 1, fitToHeight: 0,
      margins: { left: .2, right: .2, top: .35, bottom: .35, header: .15, footer: .15 },
    },
  });
  const last = columns.length;
  sheet.columns = columns as ExcelJS.Column[];
  const title = (row: number, text: string, options: { size?: number; bold?: boolean; italic?: boolean; color?: string; fill?: string } = {}) => {
    sheet.mergeCells(row, 1, row, last);
    const cell = sheet.getCell(row, 1);
    cell.value = text;
    cell.font = { name: "Arial", size: options.size || 10, bold: options.bold, italic: options.italic, color: { argb: options.color || "FF1C3528" } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    if (options.fill) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: options.fill } };
    return sheet.getRow(row);
  };
  title(1, "Bộ phận, đơn vị nhận lệnh: Trạm trộn, xe bồn, xe xúc, thí nghiệm, vật tư…", { size: 12, bold: true }).height = 22;
  title(2, "Nghiệp vụ KDBT · Kế hoạch sản xuất và điều phối cấp hàng", { size: 10, bold: true, italic: true, color: "FF536B90" }).height = 19;
  const day = new Intl.DateTimeFormat("vi-VN", { dateStyle: "long", timeZone: "Asia/Ho_Chi_Minh" }).format(from);
  title(3, `KẾ HOẠCH CẤP BÊ TÔNG · ${day}`, { size: 15, bold: true, color: "FFFFFFFF", fill: "FF174B3B" }).height = 31;
  const total = rows.reduce((sum, row) => sum + Number(row.quantityM3), 0);
  const actual = rows.reduce((sum, row) => sum + Number(row.actualM3), 0);
  title(4, `Tổng khối lượng đặt: ${total.toLocaleString("vi-VN")} m³     |     Tổng thực đổ: ${actual.toLocaleString("vi-VN")} m³     |     Số booking: ${rows.length}`, { size: 11, bold: true, color: "FF214735", fill: "FFE6F1E9" }).height = 23;
  title(5, "Giờ xuất phát và giờ đổ theo lịch đã xác nhận · Có thể điều chỉnh trong phần mềm", { size: 9, italic: true, color: "FF66776B", fill: "FFF4F7F3" }).height = 19;

  const header = sheet.getRow(6);
  header.values = columns.map((column) => column.header);
  header.height = 32;
  header.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF173F34" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE6EEE4" } };
    cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: "FF52685A" } }, bottom: { style: "medium", color: { argb: "FF52685A" } },
      left: { style: "thin", color: { argb: "FFCBD4CA" } }, right: { style: "thin", color: { argb: "FFCBD4CA" } },
    };
  });
  sheet.autoFilter = { from: { row: 6, column: 1 }, to: { row: 6, column: last } };
  rows.forEach((order, index) => {
    const row = sheet.addRow([
      index + 1, timeVN(order.plannedStartAt), timeVN(order.plannedEndAt), order.bookingNo,
      order.customerName, order.siteAddress, order.salesRepName, order.contactPhone || "",
      Number(order.quantityM3), Number(order.actualM3), order.grade, order.sandType, order.stoneType,
      order.pumpOperator || "", order.assignedVehicle || "",
      order.truckCapacityM3 ? `${order.truckCapacityM3} m³/chuyến` : "", order.pourType || "", order.salesNote || order.planningNote || "",
    ]);
    row.height = 24;
    row.eachCell((cell, column) => {
      cell.font = { name: "Arial", size: 9, color: { argb: order.status === "CANCELLED" ? "FFBF3030" : "FF27372D" } };
      cell.alignment = { vertical: "middle", horizontal: [1, 9, 10].includes(column) ? "center" : "left", wrapText: true };
      cell.border = { bottom: { style: "hair", color: { argb: "FFBBC4BA" } }, left: { style: "hair", color: { argb: "FFE0E4DE" } }, right: { style: "hair", color: { argb: "FFE0E4DE" } } };
      if (index % 2 === 1) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F9F6" } };
    });
    row.getCell(4).font = { name: "Arial", size: 9, bold: true, color: { argb: "FF17533B" } };
    row.getCell(9).numFmt = "#,##0.0";
    row.getCell(10).numFmt = "#,##0.0";
    row.getCell(12).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2A8" } };
    row.getCell(13).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF2A8" } };
    const vehicle = row.getCell(15);
    if (order.assignedVehicle) {
      vehicle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: order.assignedVehicle.toLowerCase().includes("bơm") ? "FFF3C8E8" : "FFBCE8F5" } };
      vehicle.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF18352A" } };
    }
  });
  const totalRow = sheet.addRow([
    "TỔNG CỘNG", "", "", "", "", "", "", "",
    { formula: `SUM(I7:I${Math.max(7, 6 + rows.length)})`, result: total },
    { formula: `SUM(J7:J${Math.max(7, 6 + rows.length)})`, result: actual }, "", "", "", "", "", "", "", "",
  ]);
  totalRow.height = 25;
  totalRow.eachCell((cell) => {
    cell.font = { name: "Arial", size: 9, bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF174B3B" } };
    cell.alignment = { vertical: "middle" };
    cell.border = { top: { style: "medium", color: { argb: "FF174B3B" } } };
  });
  totalRow.getCell(9).numFmt = "#,##0.0";
  totalRow.getCell(10).numFmt = "#,##0.0";
  sheet.headerFooter.oddFooter = "&LCENCOM · Kế hoạch điều phối&RTrang &P / &N";
  sheet.pageSetup.printTitlesRow = "1:6";
  sheet.pageSetup.horizontalCentered = true;
  sheet.properties.defaultRowHeight = 21;
  return workbook;
}
