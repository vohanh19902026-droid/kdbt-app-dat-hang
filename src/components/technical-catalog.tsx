"use client";

import { ProductCatalogManager } from "@/components/product-catalog-manager";
import { useState } from "react";
import type { AppSettings } from "@/lib/app-settings";

export function TechnicalCatalog({ initialCatalog, initialArchived }: { initialCatalog: AppSettings["catalog"]; initialArchived: AppSettings["catalogArchived"] }) {
  const [catalog, setCatalog] = useState(initialCatalog);
  const [archived, setArchived] = useState(initialArchived);
  return <ProductCatalogManager catalog={catalog} archived={archived} canDelete={false} allowedKeys={["grades", "sandTypes", "stoneTypes", "pumpTypes"]} onChange={(nextCatalog, nextArchived) => { setCatalog(nextCatalog); setArchived(nextArchived); }} />;
}
