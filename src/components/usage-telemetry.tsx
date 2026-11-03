"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const trackedRoutes = new Set(["/orders", "/receiving", "/planning", "/reports", "/customers", "/accounting", "/admin/settings", "/technical/catalog", "/notifications"]);

export function UsageTelemetry() {
  const pathname = usePathname();
  const isInitialPage = useRef(true);
  useEffect(() => {
    if (!trackedRoutes.has(pathname)) return;
    const dedupeKey = `cencom-usage:${pathname}`;
    const lastTrackedAt = Number(window.sessionStorage.getItem(dedupeKey) || 0);
    if (Date.now() - lastTrackedAt < 60_000) return;
    const startedAt = performance.now();
    const includeInitialAssets = isInitialPage.current;
    const timer = window.setTimeout(() => {
      const navigationBytes = includeInitialAssets
        ? performance.getEntriesByType("navigation").reduce((total, entry) => total + (entry as PerformanceNavigationTiming).transferSize, 0)
        : 0;
      const resourceBytes = performance.getEntriesByType("resource")
        .filter((entry): entry is PerformanceResourceTiming => entry instanceof PerformanceResourceTiming)
        .filter((entry) => (includeInitialAssets || entry.startTime >= startedAt) && entry.name.startsWith(window.location.origin) && !entry.name.includes("/api/telemetry"))
        .reduce((total, entry) => total + entry.transferSize, 0);
      const transferBytes = navigationBytes + resourceBytes;
      isInitialPage.current = false;
      window.sessionStorage.setItem(dedupeKey, String(Date.now()));
      void fetch("/api/telemetry", {
        method: "POST", credentials: "same-origin", keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ route: pathname, transferBytes }),
      }).catch(() => undefined);
    }, 1300);
    return () => window.clearTimeout(timer);
  }, [pathname]);
  return null;
}
