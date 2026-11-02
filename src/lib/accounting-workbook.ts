import ExcelJS from "exceljs";

export type AccountingWorkbookData = {
  period: { from: string; to: string };
  salesRepFilterLabel: string;
  periodTotals: { chargesVnd: string; paymentsVnd: string };
  allTimeBalanceVnd: string;
  balances: Array<{
    customerName: string;
    salesRepName: string | null;
    chargesVnd: string;
    paymentsVnd: string;
    balanceVnd: string;
  }>;
  entries: Array<{
    occurredAt: string;
    customerName: string;
    salesRepName: string | null;
    bookingNo: string | null;
    entryType: "CHARGE" | "PAYMENT";
    amountVnd: string;
    referenceNo: string | null;
    note: string | null;
    createdByName: string | null;
  }>;
  maxEntriesReached: boolean;
};

const money = (value: string) => Number(BigInt(value));
const headerFill = { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb: "FF164E3B" } };

export function createAccountingWorkbook(data: AccountingWorkbookData): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "CENCOM";
  workbook.subject = "Sổ theo dõi công nợ khách hàng";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Sổ công nợ", {
    properties: { defaultRowHeight: 22 },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [
    { width: 24 }, { width: 24 }, { width: 23 }, { width: 18 }, { width: 20 },
    { width: 23 }, { width: 24 }, { width: 45 }, { width: 22 },
  ];

  sheet.mergeCells("A1:I1");
  sheet.getCell("A1").value = "SỔ THEO DÕI CÔNG NỢ KHÁCH HÀNG";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF164E3B" } };
  sheet.getCell("A1").alignment = { horizontal: "center" };
  sheet.mergeCells("A2:I2");
  sheet.getCell("A2").value = `Kỳ ghi nhận: ${data.period.from} đến ${data.period.to} · Nhân viên kinh doanh: ${data.salesRepFilterLabel}`;
  sheet.getCell("A2").alignment = { horizontal: "center" };

  sheet.addRow([]);
  sheet.addRow(["TỔNG HỢP TRONG KỲ", "SỐ TIỀN (VND)"]);
  sheet.addRow(["Phải thu trong kỳ", money(data.periodTotals.chargesVnd)]);
  sheet.addRow(["Đã thu trong kỳ", money(data.periodTotals.paymentsVnd)]);
  sheet.addRow(["Còn phải thu lũy kế", money(data.allTimeBalanceVnd)]);
  const summaryHeader = sheet.getRow(4);
  summaryHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  summaryHeader.fill = headerFill;
  for (const row of [5, 6, 7]) sheet.getCell(row, 2).numFmt = '#,##0;[Red]-#,##0';

  sheet.addRow([]);
  const balanceTitleRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${balanceTitleRow}:E${balanceTitleRow}`);
  sheet.getCell(`A${balanceTitleRow}`).value = "SỐ DƯ THEO KHÁCH HÀNG";
  sheet.getCell(`A${balanceTitleRow}`).font = { bold: true, size: 12 };
  const balanceHeaderRow = sheet.addRow(["Khách hàng", "Nhân viên kinh doanh", "Tổng phải thu (VND)", "Tổng đã thu (VND)", "Còn phải thu (VND)"]);
  balanceHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  balanceHeaderRow.fill = headerFill;
  for (const balance of data.balances) {
    const row = sheet.addRow([balance.customerName, balance.salesRepName ?? "Chưa phân công", money(balance.chargesVnd), money(balance.paymentsVnd), money(balance.balanceVnd)]);
    for (let column = 3; column <= 5; column++) row.getCell(column).numFmt = '#,##0;[Red]-#,##0';
  }

  sheet.addRow([]);
  const entriesTitleRow = sheet.rowCount + 1;
  sheet.mergeCells(`A${entriesTitleRow}:I${entriesTitleRow}`);
  sheet.getCell(`A${entriesTitleRow}`).value = "GIAO DỊCH CHI TIẾT";
  sheet.getCell(`A${entriesTitleRow}`).font = { bold: true, size: 12 };
  const entriesHeader = sheet.addRow(["Ngày", "Khách hàng", "Nhân viên kinh doanh", "Booking", "Loại", "Số tiền (VND)", "Số hóa đơn / phiếu thu", "Diễn giải", "Người ghi"]);
  entriesHeader.font = { bold: true, color: { argb: "FFFFFFFF" } };
  entriesHeader.fill = headerFill;
  for (const entry of data.entries) {
    const row = sheet.addRow([
      new Date(entry.occurredAt), entry.customerName, entry.salesRepName ?? "Chưa phân công", entry.bookingNo ?? "",
      entry.entryType === "CHARGE" ? "Phải thu" : "Đã thu", money(entry.amountVnd),
      entry.referenceNo ?? "", entry.note ?? "", entry.createdByName ?? "",
    ]);
    row.getCell(1).numFmt = "dd/mm/yyyy";
    row.getCell(6).numFmt = '#,##0;[Red]-#,##0';
  }
  if (data.maxEntriesReached) {
    const noteRow = sheet.addRow(["Lưu ý", "Bản xuất giới hạn 1.000 giao dịch gần nhất trong kỳ; hãy lọc khoảng ngày ngắn hơn để xem đầy đủ."]);
    sheet.mergeCells(`B${noteRow.number}:I${noteRow.number}`);
    noteRow.getCell(1).font = { bold: true, color: { argb: "FFB45309" } };
  }

  sheet.autoFilter = {
    from: { row: entriesHeader.number, column: 1 },
    to: { row: sheet.rowCount, column: 9 },
  };
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFD1D5DB" } },
        left: { style: "thin", color: { argb: "FFD1D5DB" } },
        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
        right: { style: "thin", color: { argb: "FFD1D5DB" } },
      };
      cell.alignment = { ...cell.alignment, vertical: "middle", wrapText: true };
    });
  });

  return workbook;
}
