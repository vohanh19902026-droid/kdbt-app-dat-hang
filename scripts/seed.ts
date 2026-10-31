import { loadEnvConfig } from "@next/env";
import { count, eq } from "drizzle-orm";

async function main() {
  if (!process.argv.includes("--allow-demo-data")) {
    throw new Error("Seeding creates demo bookings. Re-run with --allow-demo-data only in a database reserved for testing.");
  }

  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add the Neon connection string to .env.local first.");
  }

  const [{ db }, schema] = await Promise.all([import("../src/db"), import("../src/db/schema")]);
  const { customers, orderEvents, orders, user } = schema;
  try {
    const [existing] = await db.select({ count: count() }).from(orders);
    if (Number(existing.count) > 0) {
      console.log(`Seed skipped: database already has ${existing.count} orders.`);
      return;
    }
    const [admin] = await db.select({ id: user.id }).from(user).where(eq(user.appRole, "ADMIN")).limit(1);
    if (!admin) throw new Error("Tạo tài khoản Admin trước rồi mới nạp dữ liệu mẫu. Xem README.");

    const date = process.argv[2] && /^\d{4}-\d{2}-\d{2}$/.test(process.argv[2])
      ? process.argv[2]
      : new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh", year: "numeric", month: "2-digit", day: "2-digit",
      }).format(new Date());
    const samples = [
      ["10:45", "Anh Văn", "Phường Lê Lợi", "Loikd", 21, "250R (14+2)", "Cát Lộc", "Đá 1x2", "Bơm cần 38m", "Xe bồn", "7", "Sàn", 4.4, "APPROVED"],
      ["11:30", "Anh Công", "Phước Thọ", "Tuankd", 50, "250 (12+2)", "Cát vàng", "Đá 1x2", "Bơm 42m", "Xe bồn", "10", "Móng", 0, "SCHEDULED"],
      ["12:30", "Anh Ánh", "Phường Vinh Tân", "thangkd", 4, "300 (14+2)", "Cát Lộc", "Đá 1x2", "Không bơm", "Xe bồn", "5", "Cột", 0, "PENDING"],
      ["12:30", "Anh Quang", "K2 Nghĩa Hội", "thangkd", 30, "250 (12+2)", "Cát nghiền", "Đá 1x2", "Bơm 42m", "Xe bồn", "10", "Móng", 21.5, "IN_PROGRESS"],
      ["13:00", "Anh Hạnh", "Nghi Hương", "thangkd", 25, "250 (12+2)", "Cát vàng", "Đá 1x2", "Bơm 50m", "Xe bồn", "7", "Sàn", 0, "PENDING"],
      ["13:30", "Anh Trường", "Thị trấn Hưng Nguyên", "tienkd", 20, "300 (12+2)", "Cát Lộc", "Đá 1x2", "Bơm cần 38m", "Xe bồn", "10", "Sàn", 20, "APPROVED"],
      ["14:00", "Anh Đăng", "Nghi Phú", "thangkd", 15, "250 (12+2)", "Cát nghiền", "Đá 1x2", "Không bơm", "Xe bồn", "5", "Móng", 0, "PENDING"],
      ["14:30", "Anh Thành", "Phường Bến Thủy", "thaokd", 6, "300 (12+2)", "Cát vàng", "Đá 1x2", "Bơm 63m", "Xe bồn", "7", "Cột", 6, "COMPLETED"],
      ["15:00", "Anh Nguyên", "Nghi Phú", "Loikd", 12, "250 (12+2)", "Cát Lộc", "Đá 1x2", "Không bơm", "Xe bồn", "10", "Đổ sàn", 0, "PENDING"],
      ["15:30", "Bác Tú", "Nghi Kim", "Loikd", 20, "C30 (12+2)", "Cát nghiền", "Đá 1x2", "Bơm 42m", "Xe bồn", "10", "Móng nhà", 0, "APPROVED"],
      ["16:00", "Anh Đức", "Đông Vinh", "hung320", 19, "300R (7+12)", "Cát Lộc", "Đá 1x2", "Bơm 40m", "Xe bồn", "7", "Sàn", 0, "PENDING"],
      ["17:30", "Nhà Anh Hùng", "Nghi Sinh", "kykd", 20, "250 (12+2)", "Cát vàng", "Đá 1x2", "Bơm cần 38m", "Xe bồn", "10", "Nhà dân", 0, "SCHEDULED"],
    ] as const;

    await db.transaction(async (tx) => {
      for (const [time, customer, address, sales, quantity, grade, sand, stone, pump, vehicle, capacity, pour, actual, status] of samples) {
        const requestedAt = new Date(`${date}T${time}:00+07:00`);
        const plannedEndAt = new Date(requestedAt.getTime() + 3_600_000);
        const [customerRow] = await tx.insert(customers).values({ name: customer, defaultAddress: address }).returning({ id: customers.id });
        const [order] = await tx.insert(orders).values({
          customerId: customerRow.id, customerName: customer, salesRepName: sales, siteAddress: address,
          contactName: customer, requestedAt, plannedStartAt: requestedAt, plannedEndAt,
          quantityM3: String(quantity), actualM3: String(actual), grade, sandType: sand, stoneType: stone,
          pumpRequired: pump, pumpOperator: pump === "Không bơm" ? null : "Nhân viên bơm", assignedVehicle: vehicle,
          truckCapacityM3: capacity, pourType: pour, status, createdBy: admin.id,
          approvedBy: status === "PENDING" ? null : admin.id, approvedAt: status === "PENDING" ? null : new Date(),
        }).returning();
        await tx.insert(orderEvents).values({
          orderId: order.id, actorUserId: admin.id, eventType: "DEMO_ORDER_SEEDED",
          newValue: JSON.stringify({ bookingNo: order.bookingNo, sales, source: "sample data" }),
        });
      }
    });
    console.log(`Đã nạp ${samples.length} booking mẫu cho ngày ${date}.`);
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Không thể nạp dữ liệu mẫu.");
  process.exitCode = 1;
});
