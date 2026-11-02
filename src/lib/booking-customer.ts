import { eq } from "drizzle-orm";
import { db } from "@/db";
import { customers } from "@/db/schema";
import type { AppRole } from "@/lib/types";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type BookingCustomerInput = { customerId?: string; customerName: string; contactPhone: string; siteAddress: string };

export async function resolveBookingCustomer(tx: Transaction, data: BookingCustomerInput, actor: { id: string; role: AppRole }) {
  if (data.customerId) {
    const [customer] = await tx.select({ id: customers.id, name: customers.name, salesRepId: customers.salesRepId, isActive: customers.isActive })
      .from(customers).where(eq(customers.id, data.customerId)).limit(1).for("update");
    if (!customer || !customer.isActive || (actor.role === "SALES" && customer.salesRepId && customer.salesRepId !== actor.id)) {
      throw new Error("INVALID_CUSTOMER");
    }
    if (actor.role === "SALES" && !customer.salesRepId) {
      await tx.update(customers).set({ salesRepId: actor.id, updatedAt: new Date() }).where(eq(customers.id, customer.id));
    }
    return { id: customer.id, name: customer.name };
  }
  const [customer] = await tx.insert(customers).values({
    name: data.customerName, phone: data.contactPhone || null, defaultAddress: data.siteAddress,
    salesRepId: actor.role === "SALES" ? actor.id : null,
  }).returning({ id: customers.id, name: customers.name });
  return customer;
}
