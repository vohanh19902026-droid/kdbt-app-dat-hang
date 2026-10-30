import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";

export const metadata: Metadata = {
  title: "CENCOM · Đặt hàng và điều phối bê tông",
  description: "Quản lý booking và kế hoạch cấp bê tông",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "CENCOM", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#174b3b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}<ServiceWorker/></body></html>;
}
