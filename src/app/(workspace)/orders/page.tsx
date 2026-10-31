import { and, asc, eq, gte, lt } from "drizzle-orm";
import { requireSession } from "@/lib/session";
import { db } from "@/db";
import { orders } from "@/db/schema";
import { OrdersWorkspace } from "@/components/orders-workspace";
import { statusLabels } from "@/lib/types";

export const runtime = "nodejs";

function todayVN(){ return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Ho_Chi_Minh",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()); }
function dateBounds(date:string){ return [new Date(`${date}T00:00:00+07:00`),new Date(`${date}T00:00:00+07:00`).getTime()+86400000] as const; }

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{date?:string;view?:string}> }) {
  const {appRole,user}=await requireSession(); const {date,view}=await searchParams; const selectedDate=date||todayVN(); const [start,end]=dateBounds(selectedDate);
  const conditions=[gte(orders.requestedAt,start),lt(orders.requestedAt,new Date(end))];
  if(appRole==="SALES") conditions.push(eq(orders.createdBy,user.id));
  const rows=await db.select().from(orders).where(and(...conditions))
    .orderBy(asc(orders.plannedStartAt), asc(orders.requestedAt));
  const data=rows.map(order=>({...order,quantityM3:Number(order.quantityM3),actualM3:Number(order.actualM3),truckCapacityM3:order.truckCapacityM3?Number(order.truckCapacityM3):null}));
  const totals={ordered:data.reduce((a,o)=>a+o.quantityM3,0),actual:data.reduce((a,o)=>a+o.actualM3,0),pending:data.filter(o=>o.status==="PENDING").length,ongoing:data.filter(o=>o.status==="IN_PROGRESS").length};
  return <OrdersWorkspace orders={data} role={appRole} date={selectedDate} view={view||"orders"} totals={totals} statusLabels={statusLabels}/>;
}
