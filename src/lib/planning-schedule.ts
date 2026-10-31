import { combineVnDateTime, isValidIsoDate, isValidTime, vnDateOf, vnTimeOf } from "@/lib/vn-date";

export type PlanningTimePatch = {
  plannedDate?: string;
  plannedStartTime?: string | null;
  plannedEndTime?: string | null;
};

export type PlanningTimeResult =
  | { ok: true; startAt: Date | null; endAt: Date | null }
  | { ok: false; error: string };

/**
 * Tính lại giờ xuất phát / giờ đổ khi kế hoạch đổi ngày hoặc đổi giờ.
 * Quy tắc: đổi ngày thì giữ nguyên giờ cũ (nếu đã có), đổi giờ thì giữ nguyên ngày đang xếp.
 */
export function resolvePlanningTimes(current: {
  requestedAt: Date;
  plannedStartAt: Date | null;
  plannedEndAt: Date | null;
}, patch: PlanningTimePatch): PlanningTimeResult {
  if (patch.plannedDate !== undefined && !isValidIsoDate(patch.plannedDate)) {
    return { ok: false, error: "Ngày kế hoạch không hợp lệ (định dạng YYYY-MM-DD)." };
  }

  let startAt = current.plannedStartAt;
  let endAt = current.plannedEndAt;

  if (patch.plannedDate !== undefined) {
    if (startAt) {
      const moved = combineVnDateTime(patch.plannedDate, vnTimeOf(startAt));
      if (!moved) return { ok: false, error: "Giờ xuất phát hiện tại không hợp lệ." };
      startAt = moved;
    }
    if (endAt) {
      const moved = combineVnDateTime(patch.plannedDate, vnTimeOf(endAt));
      if (!moved) return { ok: false, error: "Giờ đổ hiện tại không hợp lệ." };
      endAt = moved;
    }
  }

  if (patch.plannedStartTime !== undefined) {
    if (!patch.plannedStartTime) {
      startAt = null;
    } else {
      if (!isValidTime(patch.plannedStartTime)) return { ok: false, error: "Giờ xuất phát phải theo định dạng HH:MM." };
      const anchor = patch.plannedDate
        ?? (current.plannedStartAt ? vnDateOf(current.plannedStartAt) : vnDateOf(current.requestedAt));
      const next = combineVnDateTime(anchor, patch.plannedStartTime);
      if (!next) return { ok: false, error: "Giờ xuất phát không hợp lệ." };
      startAt = next;
    }
  }

  if (patch.plannedEndTime !== undefined) {
    if (!patch.plannedEndTime) {
      endAt = null;
    } else {
      if (!isValidTime(patch.plannedEndTime)) return { ok: false, error: "Giờ đổ phải theo định dạng HH:MM." };
      const anchor = patch.plannedDate
        ?? (current.plannedEndAt
          ? vnDateOf(current.plannedEndAt)
          : startAt
            ? vnDateOf(startAt)
            : vnDateOf(current.requestedAt));
      const next = combineVnDateTime(anchor, patch.plannedEndTime);
      if (!next) return { ok: false, error: "Giờ đổ không hợp lệ." };
      endAt = next;
    }
  }

  return { ok: true, startAt, endAt };
}
