import type { OrderStatus } from "@/lib/types";

const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["SCHEDULED", "CANCELLED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from].includes(to);
}

export function validatePlanningState(input: {
  status: OrderStatus;
  plannedStartAt: Date | null;
  plannedEndAt: Date | null;
  assignedVehicle: string | null;
}) {
  if (input.plannedStartAt && input.plannedEndAt && input.plannedEndAt < input.plannedStartAt) {
    return "Giờ đổ phải bằng hoặc sau giờ xuất phát.";
  }
  if (["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(input.status)
    && (!input.plannedStartAt || !input.plannedEndAt || !input.assignedVehicle?.trim())) {
    return "Cần nhập giờ xuất phát, giờ đổ và phương tiện trước khi xếp lịch cấp hàng.";
  }
  return null;
}

export const planningFields = ["plannedStartAt", "plannedEndAt", "quantityM3", "actualM3", "grade", "sandType", "stoneType", "contactPhone", "pumpOperator", "pumpRequired", "assignedVehicle", "truckCapacityM3", "planningNote", "pourType"] as const;
