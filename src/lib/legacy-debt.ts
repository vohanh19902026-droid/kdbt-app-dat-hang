import { and, asc, count, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { legacyDebtObservations, legacySalesRoster } from "@/db/schema";
import type { AppRole } from "@/lib/types";

export type LegacyDebtFilters = {
  query: string;
  month: string | null;
  segment: "DA" | "DC" | null;
  rosterId: string | null;
  page: number;
  pageSize: number;
};

type UserScope = { userId: string; appRole: AppRole };

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, "\\$&");
}

async function rosterScope(user: UserScope): Promise<string[] | null> {
  if (user.appRole !== "SALES") return null;
  const rows = await db.select({ id: legacySalesRoster.id }).from(legacySalesRoster)
    .where(and(eq(legacySalesRoster.mappedUserId, user.userId), eq(legacySalesRoster.reviewStatus, "CONFIRMED_CURRENT")));
  return rows.map((row) => row.id);
}

export async function getLegacyDebtData(user: UserScope, filters: LegacyDebtFilters) {
  const ownRosterIds = await rosterScope(user);
  if (ownRosterIds && ownRosterIds.length === 0) return { rows: [], total: 0, page: filters.page, pageSize: filters.pageSize, salesPeople: [] };

  const conditions = [
    filters.month ? eq(legacyDebtObservations.reportMonth, `${filters.month}-01`) : undefined,
    filters.segment ? eq(legacyDebtObservations.segment, filters.segment) : undefined,
    filters.rosterId ? eq(legacyDebtObservations.rosterId, filters.rosterId) : undefined,
    ownRosterIds ? inArray(legacyDebtObservations.rosterId, ownRosterIds) : undefined,
  ];
  const query = filters.query.trim();
  if (query) {
    const pattern = `%${escapeLike(query)}%`;
    conditions.push(or(
      ilike(legacyDebtObservations.sourceName, pattern),
      ilike(legacyDebtObservations.sourceProjectName, pattern),
      ilike(legacyDebtObservations.sourceCustomerCode, pattern),
      ilike(legacyDebtObservations.sourceAddress, pattern),
      ilike(legacyDebtObservations.sourceSalesperson, pattern),
    ));
  }
  const where = and(...conditions);
  const [countRow] = await db.select({ value: count() }).from(legacyDebtObservations).where(where);
  const rows = await db.select({
    observationId: legacyDebtObservations.observationId,
    month: legacyDebtObservations.reportMonth,
    segment: legacyDebtObservations.segment,
    sourceName: legacyDebtObservations.sourceName,
    sourceProjectName: legacyDebtObservations.sourceProjectName,
    sourceAddress: legacyDebtObservations.sourceAddress,
    sourcePhone: legacyDebtObservations.sourcePhone,
    sourceCustomerCode: legacyDebtObservations.sourceCustomerCode,
    salesPerson: legacyDebtObservations.sourceSalesperson,
    openingRaw: legacyDebtObservations.openingRaw,
    openingValue: legacyDebtObservations.openingValue,
    revenueRaw: legacyDebtObservations.revenueRaw,
    revenueValue: legacyDebtObservations.revenueValue,
    receiptsRaw: legacyDebtObservations.receiptsRaw,
    receiptsValue: legacyDebtObservations.receiptsValue,
    closingRaw: legacyDebtObservations.closingRaw,
    closingValue: legacyDebtObservations.closingValue,
    openingCell: legacyDebtObservations.openingCell,
    revenueCell: legacyDebtObservations.revenueCell,
    receiptsCell: legacyDebtObservations.receiptsCell,
    closingCell: legacyDebtObservations.closingCell,
    residual: legacyDebtObservations.residual,
    reconciliationStatus: legacyDebtObservations.reconciliationStatus,
    unitStatus: legacyDebtObservations.unitStatus,
    identityKeyQuality: legacyDebtObservations.identityKeyQuality,
    reviewStatus: legacyDebtObservations.reviewStatus,
    sourceFile: legacyDebtObservations.sourceFile,
    sourceSha256: legacyDebtObservations.sourceSha256,
    sourceSheet: legacyDebtObservations.sourceSheet,
    sourceRow: legacyDebtObservations.sourceRow,
    sourceRange: legacyDebtObservations.sourceRange,
    rosterId: legacyDebtObservations.rosterId,
  }).from(legacyDebtObservations).where(where)
    .orderBy(asc(legacyDebtObservations.sourceName), asc(legacyDebtObservations.reportMonth), asc(legacyDebtObservations.sourceRow))
    .limit(filters.pageSize).offset((filters.page - 1) * filters.pageSize);

  const salesPeople = ownRosterIds
    ? await db.select({ id: legacySalesRoster.id, name: legacySalesRoster.displayName, segment: legacySalesRoster.segment })
        .from(legacySalesRoster).where(inArray(legacySalesRoster.id, ownRosterIds)).orderBy(asc(legacySalesRoster.displayName))
    : await db.select({ id: legacySalesRoster.id, name: legacySalesRoster.displayName, segment: legacySalesRoster.segment })
        .from(legacySalesRoster).orderBy(asc(legacySalesRoster.displayName));

  return { rows, total: Number(countRow?.value ?? 0), page: filters.page, pageSize: filters.pageSize, salesPeople };
}

export async function getLegacyDebtExportRows(user: UserScope, filters: Omit<LegacyDebtFilters, "page" | "pageSize">, maxRows = 10000) {
  const result = await getLegacyDebtData(user, { ...filters, page: 1, pageSize: maxRows + 1 });
  if (result.total > maxRows || result.rows.length > maxRows) throw new RangeError("LEGACY_EXPORT_TOO_LARGE");
  return result.rows;
}
