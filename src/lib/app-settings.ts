import { cache } from "react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";
import { defaultProductCatalog, emptyArchivedProductCatalog, normalizeArchivedProductCatalog, normalizeProductCatalog, type ArchivedProductCatalog, type ProductCatalog } from "@/lib/product-catalog";

export type AppSettings = {
  companyName: string;
  companySubtitle: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  themeMode: "light" | "dark";
  accentColor: "green" | "blue" | "purple" | "red" | "amber";
  fontFamily: "dm-sans" | "manrope" | "system";
  fontScale: number;
  catalog: ProductCatalog;
  catalogArchived: ArchivedProductCatalog;
};

export const defaultAppSettings: AppSettings = {
  companyName: "CENCOM",
  companySubtitle: "ĐIỀU PHỐI BÊ TÔNG",
  companyPhone: "",
  companyEmail: "",
  companyAddress: "",
  themeMode: "light",
  accentColor: "green",
  fontFamily: "dm-sans",
  fontScale: 100,
  catalog: defaultProductCatalog,
  catalogArchived: emptyArchivedProductCatalog,
};

export function normalizeAppSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultAppSettings;
  const settings = value as Partial<AppSettings>;
  const catalog = normalizeProductCatalog(settings.catalog);
  return { ...defaultAppSettings, ...settings, catalog, catalogArchived: normalizeArchivedProductCatalog(settings.catalogArchived, catalog) };
}

export const getAppSettings = cache(async function getAppSettings(): Promise<AppSettings> {
  try {
    const [row] = await db.select({ values: appSettings.values }).from(appSettings).where(eq(appSettings.id, "default")).limit(1);
    if (row?.values && typeof row.values === "object") return normalizeAppSettings(row.values);
  } catch {
    // Keep app pages available while the settings migration is being rolled out.
  }
  return defaultAppSettings;
});
