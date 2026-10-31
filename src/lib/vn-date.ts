const VN_TIME_ZONE = "Asia/Ho_Chi_Minh";
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const HOUR_MINUTE = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Ngày hôm nay theo múi giờ Việt Nam, định dạng YYYY-MM-DD. */
export function todayVN(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now);
}

/** Kiểm tra chuỗi YYYY-MM-DD có đúng là một ngày tồn tại trên lịch. */
export function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 2000 || year > 2100) return false;
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCFullYear() === year
    && probe.getUTCMonth() === month - 1
    && probe.getUTCDate() === day;
}

/** Chuẩn hóa tham số ngày từ URL: sai định dạng/không tồn tại thì trả ngày hôm nay. */
export function normalizeIsoDate(value: unknown, fallback: string = todayVN()): string {
  return isValidIsoDate(value) ? value : fallback;
}

/** Kiểm tra giờ HH:MM trong ngày. */
export function isValidTime(value: unknown): value is string {
  return typeof value === "string" && HOUR_MINUTE.test(value);
}

/** Khoảng [00:00, 24:00) giờ Việt Nam của một ngày. Ném lỗi nếu ngày không hợp lệ. */
export function vnDateRange(date: string): { from: Date; to: Date } {
  if (!isValidIsoDate(date)) throw new RangeError("INVALID_DATE");
  const from = new Date(`${date}T00:00:00+07:00`);
  return { from, to: new Date(from.getTime() + 86_400_000) };
}

/** Ngày Việt Nam của một mốc thời gian, định dạng YYYY-MM-DD. */
export function vnDateOf(value: Date): string {
  if (Number.isNaN(value.getTime())) throw new RangeError("INVALID_DATE");
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(value);
}

/** Giờ Việt Nam của một mốc thời gian, định dạng HH:MM. */
export function vnTimeOf(value: Date): string {
  if (Number.isNaN(value.getTime())) throw new RangeError("INVALID_DATE");
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: VN_TIME_ZONE, hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(value);
}

/** Ghép ngày + giờ Việt Nam thành mốc thời gian tuyệt đối; trả null nếu đầu vào sai. */
export function combineVnDateTime(date: string, time: string): Date | null {
  if (!isValidIsoDate(date) || !isValidTime(time)) return null;
  const result = new Date(`${date}T${time}:00+07:00`);
  return Number.isNaN(result.getTime()) ? null : result;
}
