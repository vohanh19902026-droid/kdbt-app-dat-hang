/**
 * Dọn dữ liệu smoke test (tên khách có tiền tố SMOKE-) khỏi DATABASE_URL.
 *
 * Chạy: npx tsx scripts/cleanup-smoke.ts --yes
 * Không có --yes thì chỉ đếm, không xóa.
 */
import { Pool } from "pg";
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("Thiếu DATABASE_URL.");

  const confirmed = process.argv.includes("--yes");
  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();
  try {
    const count = await client.query<{ total: string }>(
      "SELECT count(*)::text AS total FROM orders WHERE customer_name LIKE 'SMOKE-%'",
    );
    const total = Number(count.rows[0]?.total ?? 0);
    console.log(`[cleanup] Booking smoke: ${total}`);
    if (!confirmed) {
      console.log("[cleanup] Chưa xóa. Thêm --yes để xóa thật.");
      return;
    }
    await client.query("BEGIN");
    try {
      const events = await client.query(
        "DELETE FROM order_events WHERE order_id IN (SELECT id FROM orders WHERE customer_name LIKE 'SMOKE-%')",
      );
      const orders = await client.query("DELETE FROM orders WHERE customer_name LIKE 'SMOKE-%'");
      const customers = await client.query("DELETE FROM customers WHERE name LIKE 'SMOKE-%'");
      await client.query("COMMIT");
      console.log(`[cleanup] Đã xóa ${orders.rowCount} booking, ${events.rowCount} sự kiện, ${customers.rowCount} khách.`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`[cleanup] LỖI: ${(error as Error).message}`);
  process.exitCode = 1;
});
