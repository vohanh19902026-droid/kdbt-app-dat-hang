export type AppRole = "ADMIN" | "PLANNER" | "SALES" | "ACCOUNTANT" | "TECHNICAL";
export type OrderStatus = "PENDING" | "APPROVED" | "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const roleLabels: Record<AppRole, string> = {
  ADMIN: "Quản trị viên",
  PLANNER: "Nhân viên kế hoạch",
  SALES: "Nhân viên kinh doanh",
  ACCOUNTANT: "Kế toán",
  TECHNICAL: "Nhân viên kỹ thuật",
};

export const statusLabels: Record<OrderStatus, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã xác nhận",
  SCHEDULED: "Đã xếp lịch",
  IN_PROGRESS: "Đang cấp",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};
