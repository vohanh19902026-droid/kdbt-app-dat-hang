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

export const planningFields = ["plannedStartAt", "plannedEndAt", "quantityM3", "actualM3", "grade", "sandType", "stoneType", "contactPhone", "pumpOperator", "pumpRequired", "assignedVehicle", "truckCapacityM3", "planningNote", "pourType"] as const;
