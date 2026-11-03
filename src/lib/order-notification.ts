import { statusLabels, type OrderStatus } from "@/lib/types";

const fieldLabels: Record<string, string> = {
  plannedDate: "Ngày cấp",
  plannedStartAt: "Giờ xuất phát",
  plannedEndAt: "Giờ đổ",
  quantityM3: "Khối lượng",
  actualM3: "Khối lượng thực đổ",
  grade: "Mác bê tông",
  sandType: "Cốt liệu I",
  stoneType: "Cốt liệu II",
  contactName: "Người liên hệ",
  contactPhone: "Số điện thoại",
  pumpOperator: "Nhân viên bơm",
  pumpRequired: "Loại xe bơm",
  assignedVehicle: "Phương tiện",
  truckCapacityM3: "Dung tích xe",
  planningNote: "Ghi chú kế hoạch",
  pourType: "Hạng mục đổ / cấu kiện",
  pourMethod: "Hình thức đổ",
  siteCategory: "Loại công trình",
  customerName: "Khách hàng",
  siteAddress: "Điểm đổ",
  salesNote: "Ghi chú kinh doanh",
  status: "Trạng thái",
};

export function createdOrderNotification(bookingNo: string, customerName: string, quantityM3: number) {
  return {
    title: `Booking mới ${bookingNo}`,
    body: `${customerName} · ${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 1 }).format(quantityM3)} m³ · cần duyệt`,
  };
}

export function updatedOrderNotification(input: {
  bookingNo: string;
  customerName: string;
  changes: Array<{ fieldName: string | null; newValue: string | null }>;
}) {
  const details = input.changes.map(({ fieldName, newValue }) => {
    const label = fieldName ? fieldLabels[fieldName] ?? fieldName : "Thông tin booking";
    const value = fieldName === "status" && newValue
      ? statusLabels[newValue as OrderStatus] ?? newValue
      : newValue || "đã xóa";
    return `${label}: ${value}`;
  });
  return {
    title: `Booking ${input.bookingNo} đã cập nhật`,
    body: `${input.customerName} · ${details.join("; ")}`.slice(0, 1000),
  };
}
