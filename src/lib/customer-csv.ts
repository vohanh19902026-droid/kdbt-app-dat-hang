export type CustomerCsvRow = {
  rowNumber: number;
  name: string;
  phone: string;
  defaultAddress: string;
  salesRepEmail: string;
  employeeCode: string;
};

export type CustomerCsvError = { rowNumber: number; message: string };

function normalizeHeader(value: string) {
  return value.trim().toLocaleLowerCase("vi").normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]/g, "");
}

function detectDelimiter(firstLine: string) {
  const candidates = [",", ";", "\t"];
  let delimiter = ",";
  let maxCount = -1;
  for (const candidate of candidates) {
    let count = 0;
    let quoted = false;
    for (let i = 0; i < firstLine.length; i++) {
      if (firstLine[i] === '"') {
        if (quoted && firstLine[i + 1] === '"') i++;
        else quoted = !quoted;
      } else if (firstLine[i] === candidate && !quoted) count++;
    }
    if (count > maxCount) { maxCount = count; delimiter = candidate; }
  }
  return delimiter;
}

function parseDelimited(text: string, delimiter: string): { rows: string[][]; malformedQuote: boolean } {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  row.push(cell);
  if (row.some((value) => value.trim()) || rows.length === 0) rows.push(row);
  return { rows, malformedQuote: quoted };
}

const headerNames = {
  name: ["tenkhachhang", "khachhang", "customer", "customername", "name"],
  phone: ["sodienthoai", "dienthoai", "phone", "phonenumber"],
  defaultAddress: ["diachimacdinh", "diachi", "address", "defaultaddress"],
  salesRepEmail: ["emailnvkd", "emailkinhdoanh", "salesemail", "salesrepemail"],
  employeeCode: ["manvkd", "manv", "employeecode", "salescode", "salesrepcode"],
} as const;

export function parseCustomerCsv(input: string): { rows: CustomerCsvRow[]; errors: CustomerCsvError[] } {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text.split(/\r?\n/, 1)[0] || "");
  const parsed = parseDelimited(text, delimiter);
  if (parsed.malformedQuote) return { rows: [], errors: [{ rowNumber: 0, message: "Tệp có dấu ngoặc kép chưa đóng. Hãy sửa nội dung ô và lưu lại CSV." }] };
  const [headerRow, ...dataRows] = parsed.rows;
  if (!headerRow?.length) return { rows: [], errors: [{ rowNumber: 1, message: "Tệp không có dòng tiêu đề." }] };
  const headers = headerRow.map(normalizeHeader);
  const positions = Object.fromEntries(Object.entries(headerNames).map(([key, aliases]) => [
    key, headers.findIndex((header) => (aliases as readonly string[]).includes(header)),
  ])) as Record<keyof typeof headerNames, number>;
  if (positions.name < 0) return { rows: [], errors: [{ rowNumber: 1, message: "Thiếu cột Tên khách hàng." }] };
  if (positions.salesRepEmail < 0 && positions.employeeCode < 0) {
    return { rows: [], errors: [{ rowNumber: 1, message: "Cần có cột Email NVKD hoặc Mã NVKD để giao khách phụ trách." }] };
  }
  const rows: CustomerCsvRow[] = [];
  const errors: CustomerCsvError[] = [];
  for (const [index, cells] of dataRows.entries()) {
    if (!cells.some((value) => value.trim())) continue;
    const value = (key: keyof typeof positions) => positions[key] < 0 ? "" : (cells[positions[key]] || "").trim();
    const name = value("name");
    if (name.length < 2 || name.length > 180) {
      errors.push({ rowNumber: index + 2, message: "Tên khách hàng cần từ 2 đến 180 ký tự." });
      continue;
    }
    const phone = value("phone");
    const defaultAddress = value("defaultAddress");
    const salesRepEmail = value("salesRepEmail");
    const employeeCode = value("employeeCode");
    if (phone.length > 40 || defaultAddress.length > 500) {
      errors.push({ rowNumber: index + 2, message: "Số điện thoại tối đa 40, địa chỉ tối đa 500 ký tự." });
      continue;
    }
    if (!salesRepEmail && !employeeCode) {
      errors.push({ rowNumber: index + 2, message: "Thiếu Email NVKD hoặc Mã NVKD phụ trách." });
      continue;
    }
    if (salesRepEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(salesRepEmail)) {
      errors.push({ rowNumber: index + 2, message: "Email NVKD không hợp lệ." });
      continue;
    }
    rows.push({ rowNumber: index + 2, name, phone, defaultAddress, salesRepEmail, employeeCode });
  }
  if (rows.length + errors.length > 200) return { rows: [], errors: [{ rowNumber: 0, message: "Mỗi lần nhập tối đa 200 khách hàng." }] };
  return { rows, errors };
}

export function normalizeCustomerDuplicateKey(customer: { name: string; phone?: string | null; defaultAddress?: string | null }) {
  const normalizeText = (value: string) => value.trim().toLocaleLowerCase("vi").normalize("NFC").replace(/\s+/g, " ");
  const phone = (customer.phone || "").replace(/\D/g, "");
  return `${normalizeText(customer.name)}|${phone}|${normalizeText(customer.defaultAddress || "")}`;
}
