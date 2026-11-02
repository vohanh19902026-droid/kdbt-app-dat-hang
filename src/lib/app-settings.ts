import { eq } from "drizzle-orm";
import { db } from "@/db";
import { appSettings } from "@/db/schema";

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
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const [row] = await db.select({ values: appSettings.values }).from(appSettings).where(eq(appSettings.id, "default")).limit(1);
    if (row?.values && typeof row.values === "object") return { ...defaultAppSettings, ...row.values } as AppSettings;
  } catch {
    // Keep app pages available while the settings migration is being rolled out.
  }
  return defaultAppSettings;
}
