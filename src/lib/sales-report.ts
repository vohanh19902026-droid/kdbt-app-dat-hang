export type ProductionOrderForReport = {
  customerName: string;
  salesRepName: string;
  quantityM3: string | number;
  actualM3: string | number;
};

export type CustomerSalesSummary = {
  customerName: string;
  salesRepName: string;
  count: number;
  ordered: number;
  actual: number;
};

export function groupProductionByCustomerAndSales(rows: ProductionOrderForReport[]): CustomerSalesSummary[] {
  const groups = new Map<string, CustomerSalesSummary>();
  for (const row of rows) {
    const key = `${row.customerName}\u0000${row.salesRepName}`;
    const group = groups.get(key) || {
      customerName: row.customerName,
      salesRepName: row.salesRepName,
      count: 0,
      ordered: 0,
      actual: 0,
    };
    group.count += 1;
    group.ordered += Number(row.quantityM3);
    group.actual += Number(row.actualM3);
    groups.set(key, group);
  }
  return [...groups.values()];
}
