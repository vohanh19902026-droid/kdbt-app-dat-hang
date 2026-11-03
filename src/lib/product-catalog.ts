import { z } from "zod";

export const productCatalogSchema = z.object({
  grades: z.array(z.string().trim().min(1).max(80)).min(1, "Mỗi danh mục cần ít nhất một lựa chọn.").max(100),
  sandTypes: z.array(z.string().trim().min(1).max(100)).min(1, "Mỗi danh mục cần ít nhất một lựa chọn.").max(100),
  stoneTypes: z.array(z.string().trim().min(1).max(100)).min(1, "Mỗi danh mục cần ít nhất một lựa chọn.").max(100),
  pumpTypes: z.array(z.string().trim().min(1).max(100)).min(1, "Mỗi danh mục cần ít nhất một lựa chọn.").max(100),
  serviceVehicles: z.array(z.string().trim().min(1).max(120)).max(200),
  truckCapacitiesM3: z.array(z.number().positive().max(30)).min(1, "Mỗi danh mục cần ít nhất một lựa chọn.").max(20),
  pourTypes: z.array(z.string().trim().min(1).max(120)).min(1, "Mỗi danh mục cần ít nhất một lựa chọn.").max(100),
  pourMethods: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
  siteCategories: z.array(z.string().trim().min(1).max(80)).min(1).max(20),
}).superRefine((catalog, context) => {
  for (const [key, values] of Object.entries(catalog)) {
    const normalized = values.map((value) => String(value).trim().toLocaleLowerCase("vi"));
    if (new Set(normalized).size !== normalized.length) {
      context.addIssue({ code: "custom", path: [key], message: "Danh mục không được chứa mục trùng." });
    }
  }
});

export type ProductCatalog = z.infer<typeof productCatalogSchema>;
export type ProductCatalogKey = keyof ProductCatalog;
export type ArchivedProductCatalog = { [K in ProductCatalogKey]: string[] };
export const emptyArchivedProductCatalog: ArchivedProductCatalog = {
  grades: [], sandTypes: [], stoneTypes: [], pumpTypes: [], serviceVehicles: [],
  truckCapacitiesM3: [], pourTypes: [], pourMethods: [], siteCategories: [],
};
export const archivedProductCatalogSchema = z.object({
  grades: z.array(z.string().trim().min(1).max(80)).max(100),
  sandTypes: z.array(z.string().trim().min(1).max(100)).max(100),
  stoneTypes: z.array(z.string().trim().min(1).max(100)).max(100),
  pumpTypes: z.array(z.string().trim().min(1).max(100)).max(100),
  serviceVehicles: z.array(z.string().trim().min(1).max(120)).max(200),
  truckCapacitiesM3: z.array(z.string().trim().min(1).max(20)).max(20),
  pourTypes: z.array(z.string().trim().min(1).max(120)).max(100),
  pourMethods: z.array(z.string().trim().min(1).max(80)).max(20),
  siteCategories: z.array(z.string().trim().min(1).max(80)).max(20),
});

export function normalizeArchivedProductCatalog(value: unknown, catalog: ProductCatalog): ArchivedProductCatalog {
  if (!value || typeof value !== "object" || Array.isArray(value)) return emptyArchivedProductCatalog;
  const record = value as Record<string, unknown>;
  return Object.fromEntries(Object.keys(emptyArchivedProductCatalog).map((rawKey) => {
    const key = rawKey as ProductCatalogKey;
    const active = new Set(catalog[key].map((item) => String(item).trim().toLocaleLowerCase("vi")));
    const archived = Array.isArray(record[key]) ? record[key].filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean) : [];
    const seen = new Set<string>();
    return [key, archived.filter((item) => {
      const normalized = item.toLocaleLowerCase("vi");
      if (active.has(normalized) || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })];
  })) as ArchivedProductCatalog;
}

export const defaultProductCatalog: ProductCatalog = {
  grades: ["250 (12+2)", "250R (14+2)", "300 (12+2)", "300R (7+12)", "C30 (12+2)", "B35 (19+1)"],
  sandTypes: ["Cát Lộc", "Cát vàng", "Cát nghiền", "Cát sông"],
  stoneTypes: ["Đá 1x2", "Đá 0.5x1", "Đá 2x4", "Đá mi"],
  pumpTypes: ["Bơm cần 38m", "Bơm 42m", "Bơm 50m", "Bơm 63m", "Bơm tĩnh", "Không bơm"],
  serviceVehicles: [],
  truckCapacitiesM3: [5, 7, 10],
  pourTypes: ["Sàn", "Mái", "Móng", "Móng đơn", "Móng bè", "Móng băng", "Cột", "Dầm", "Tường", "Khác"],
  pourMethods: ["Đổ xả", "Bơm"],
  siteCategories: ["Dự án", "Dân cư"],
};

export function normalizeProductCatalog(value: unknown): ProductCatalog {
  const parsed = productCatalogSchema.safeParse(value);
  if (parsed.success) return parsed.data;
  if (!value || typeof value !== "object" || Array.isArray(value)) return defaultProductCatalog;
  const record = value as Record<string, unknown>;
  const merged = Object.fromEntries(Object.entries(defaultProductCatalog).map(([key, defaults]) => {
    const candidate = record[key];
    return [key, Array.isArray(candidate) && candidate.length > 0 ? candidate : defaults];
  }));
  const fallback = productCatalogSchema.safeParse(merged);
  return fallback.success ? fallback.data : defaultProductCatalog;
}
