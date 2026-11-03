import ExcelJS from "exceljs";

export type CustomerImportRow = {
  rowNumber: number;
  name: string;
  phone: string;
  defaultAddress: string;
  salesRepEmail: string;
  employeeCode: string;
};

export type CustomerWorkbookError = { rowNumber: number; message: string };

const headers = {
  name: ["tenkhachhang", "khachhang", "customer", "customername", "name"],
  phone: ["sodienthoai", "dienthoai", "phone", "phonenumber"],
  defaultAddress: ["diachimacdinh", "diachi", "address", "defaultaddress"],
  salesRepEmail: ["emailnvkd", "emailkinhdoanh", "salesemail", "salesrepemail"],
  employeeCode: ["manvkd", "manv", "employeecode", "salescode", "salesrepcode"],
} as const;

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
}

function cellText(cell: ExcelJS.Cell) {
  const value = cell.value;
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object" && "richText" in value) return value.richText.map((part) => part.text).join("").trim();
  return "";
}

export function createCustomerImportTemplate() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CENCOM";
  workbook.subject = "Mẫu nhập danh mục khách hàng";
  const sheet = workbook.addWorksheet("Danh sách khách hàng", {
    properties: { defaultRowHeight: 23 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [{ width: 34 }, { width: 20 }, { width: 46 }, { width: 32 }, { width: 18 }];
  sheet.mergeCells("A1:E1");
  sheet.getCell("A1").value = "DANH SÁCH KHÁCH HÀNG – CENCOM";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF164E3B" } };
  sheet.getRow(1).height = 34;
  sheet.mergeCells("A2:E2");
  sheet.getCell("A2").value = "Điền thông tin từ dòng 5. Bắt buộc: Tên khách hàng và Email NVKD hoặc Mã NVKD đang hoạt động. Không đổi tên các cột tiêu đề.";
  sheet.getCell("A2").font = { italic: true, size: 10, color: { argb: "FF475569" } };
  sheet.getCell("A2").alignment = { wrapText: true, vertical: "middle" };
  sheet.getRow(2).height = 32;
  sheet.mergeCells("A3:E3");
  sheet.getCell("A3").value = "Hệ thống bỏ qua dòng trùng và kiểm tra NVKD trước khi nhập. Mỗi lần tối đa 200 khách hàng.";
  sheet.getCell("A3").font = { size: 10, color: { argb: "FF64748B" } };
  sheet.getCell("A3").alignment = { wrapText: true, vertical: "middle" };
  sheet.getRow(3).height = 25;
  const header = sheet.getRow(4);
  header.values = ["Tên khách hàng", "Số điện thoại", "Địa chỉ mặc định", "Email NVKD", "Mã NVKD"];
  header.height = 28;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF267456" } };
  header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  header.eachCell((cell) => { cell.border = { bottom: { style: "medium", color: { argb: "FF164E3B" } } }; });
  for (let row = 5; row <= 24; row++) {
    sheet.getRow(row).height = 23;
    if (row % 2 === 1) for (let column = 1; column <= 5; column++) {
      sheet.getCell(row, column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7F4" } };
    }
  }
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  sheet.autoFilter = "A4:E24";
  sheet.getColumn(2).numFmt = "@";
  sheet.getColumn(4).numFmt = "@";
  sheet.getColumn(5).numFmt = "@";
  return workbook;
}

export function createCustomerExportWorkbook(rows: Array<{
  name: string; phone: string | null; defaultAddress: string | null;
  salesRepName: string | null; employeeCode: string | null; isActive: boolean; createdAt: Date;
}>) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CENCOM";
  workbook.subject = "Danh mục khách hàng";
  workbook.created = new Date();
  const sheet = workbook.addWorksheet("Khách hàng", {
    properties: { defaultRowHeight: 23 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [{ width: 9 }, { width: 34 }, { width: 20 }, { width: 46 }, { width: 28 }, { width: 16 }, { width: 18 }, { width: 18 }];
  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "DANH MỤC KHÁCH HÀNG";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF164E3B" } };
  sheet.getCell("A1").alignment = { horizontal: "center", vertical: "middle" };
  sheet.getRow(1).height = 34;
  sheet.mergeCells("A2:H2");
  sheet.getCell("A2").value = `Ngày xuất: ${new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · Tổng số: ${rows.length} khách hàng`;
  sheet.getCell("A2").alignment = { horizontal: "center", vertical: "middle" };
  const header = sheet.getRow(4);
  header.values = ["STT", "Tên khách hàng", "Số điện thoại", "Địa chỉ mặc định", "Nhân viên kinh doanh", "Mã NVKD", "Trạng thái", "Ngày tạo"];
  header.height = 30;
  header.font = { bold: true, color: { argb: "FFFFFFFF" } };
  header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF164E3B" } };
  header.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
  rows.forEach((item, index) => {
    const row = sheet.addRow([index + 1, item.name, item.phone || "", item.defaultAddress || "", item.salesRepName || "Chưa phân công", item.employeeCode || "", item.isActive ? "Đang hoạt động" : "Đã ngừng", item.createdAt]);
    row.getCell(8).numFmt = "dd/mm/yyyy hh:mm";
    if (index % 2 === 1) for (let column = 1; column <= 8; column++) row.getCell(column).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF2F7F4" } };
  });
  sheet.views = [{ state: "frozen", ySplit: 4 }];
  sheet.autoFilter = { from: "A4", to: `H${Math.max(4, rows.length + 4)}` };
  sheet.getColumn(3).numFmt = "@";
  sheet.getColumn(6).numFmt = "@";
  sheet.eachRow((row, rowNumber) => row.eachCell((cell) => {
    cell.alignment = { ...cell.alignment, vertical: "middle", wrapText: true };
    if (rowNumber >= 4) cell.border = { bottom: { style: "thin", color: { argb: "FFD7E1DA" } } };
  }));
  return workbook;
}

export async function parseCustomerWorkbook(buffer: Buffer): Promise<{ rows: CustomerImportRow[]; errors: CustomerWorkbookError[] }> {
  const workbook = new ExcelJS.Workbook();
  try { await workbook.xlsx.load(buffer as never); }
  catch { return { rows: [], errors: [{ rowNumber: 0, message: "Không đọc được tệp XLSX. Hãy mở và lưu lại bằng Excel rồi thử lại." }] }; }
  const sheet = workbook.worksheets[0];
  if (!sheet) return { rows: [], errors: [{ rowNumber: 0, message: "Tệp không có trang tính." }] };
  let headerRow = 0;
  let positions: Record<keyof typeof headers, number> | undefined;
  for (let row = 1; row <= Math.min(sheet.rowCount, 15); row++) {
    const values = sheet.getRow(row).values as ExcelJS.CellValue[];
    const normalized = values.map((value) => normalizeHeader(typeof value === "string" ? value : ""));
    const found = Object.fromEntries(Object.entries(headers).map(([key, aliases]) => [
      key, normalized.findIndex((header) => (aliases as readonly string[]).includes(header)),
    ])) as Record<keyof typeof headers, number>;
    if (found.name >= 0) { headerRow = row; positions = found; break; }
  }
  if (!headerRow || !positions) return { rows: [], errors: [{ rowNumber: 0, message: "Không tìm thấy tiêu đề Tên khách hàng trong 15 dòng đầu." }] };
  if (positions.salesRepEmail < 0 && positions.employeeCode < 0) return { rows: [], errors: [{ rowNumber: headerRow, message: "Cần có cột Email NVKD hoặc Mã NVKD để giao khách phụ trách." }] };
  const rows: CustomerImportRow[] = [];
  const errors: CustomerWorkbookError[] = [];
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const value = (key: keyof typeof positions) => positions![key] < 1 ? "" : cellText(row.getCell(positions![key]));
    if (!row.hasValues) continue;
    const name = value("name");
    const phone = value("phone");
    const defaultAddress = value("defaultAddress");
    const salesRepEmail = value("salesRepEmail");
    const employeeCode = value("employeeCode");
    if (name.length < 2 || name.length > 180) { errors.push({ rowNumber, message: "Tên khách hàng cần từ 2 đến 180 ký tự." }); continue; }
    if (phone.length > 40 || defaultAddress.length > 500) { errors.push({ rowNumber, message: "Số điện thoại tối đa 40, địa chỉ tối đa 500 ký tự." }); continue; }
    if (!salesRepEmail && !employeeCode) { errors.push({ rowNumber, message: "Thiếu Email NVKD hoặc Mã NVKD phụ trách." }); continue; }
    if (salesRepEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(salesRepEmail)) { errors.push({ rowNumber, message: "Email NVKD không hợp lệ." }); continue; }
    rows.push({ rowNumber, name, phone, defaultAddress, salesRepEmail, employeeCode });
  }
  if (rows.length + errors.length > 200) return { rows: [], errors: [{ rowNumber: 0, message: "Mỗi lần nhập tối đa 200 khách hàng." }] };
  if (!rows.length && !errors.length) errors.push({ rowNumber: 0, message: "Tệp chưa có dòng dữ liệu khách hàng." });
  return { rows, errors };
}

export function normalizeCustomerDuplicateKey(customer: { name: string; phone?: string | null; defaultAddress?: string | null }) {
  const normalizeText = (value: string) => value.trim().toLocaleLowerCase("vi").normalize("NFC").replace(/\s+/g, " ");
  const phone = (customer.phone || "").replace(/\D/g, "");
  return `${normalizeText(customer.name)}|${phone}|${normalizeText(customer.defaultAddress || "")}`;
}
