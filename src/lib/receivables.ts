import { z } from "zod";
import { isValidIsoDate } from "@/lib/vn-date";

export type ReceivableKind = "CHARGE" | "PAYMENT";
export type ReceivableAmount = { entryType: ReceivableKind; amountVnd: string };
export const MAX_AMOUNT_VND = 999_999_999_999_999;

export const receivableEntrySchema = z.object({
  customerId: z.uuid(),
  orderId: z.uuid().nullable().optional(),
  entryType: z.enum(["CHARGE", "PAYMENT"]),
  amountVnd: z.coerce.number().int().positive().max(MAX_AMOUNT_VND),
  occurredOn: z.string().refine(isValidIsoDate, "Ngày ghi sổ không hợp lệ."),
  referenceNo: z.string().trim().max(100).optional().default(""),
  note: z.string().trim().max(1000).optional().default(""),
});

export function canAccessReceivables(role: string): boolean {
  return role === "ADMIN" || role === "ACCOUNTANT";
}

export function summarizeReceivableEntries(entries: ReceivableAmount[]) {
  let chargesVnd = 0n;
  let paymentsVnd = 0n;
  for (const entry of entries) {
    const amount = BigInt(entry.amountVnd);
    if (entry.entryType === "CHARGE") chargesVnd += amount;
    else paymentsVnd += amount;
  }
  return {
    chargesVnd: chargesVnd.toString(),
    paymentsVnd: paymentsVnd.toString(),
    balanceVnd: (chargesVnd - paymentsVnd).toString(),
  };
}

const vndFormatter = new Intl.NumberFormat("vi-VN", {
  style: "currency", currency: "VND", maximumFractionDigits: 0,
});

export function formatVnd(value: string | bigint): string {
  try { return vndFormatter.format(typeof value === "bigint" ? value : BigInt(value)); }
  catch { return vndFormatter.format(0); }
}
