/**
 * Áp migration SQL trong thư mục drizzle/ lên DATABASE_URL.
 *
 * Đặc điểm an toàn:
 * - Mỗi file chạy trong 1 transaction riêng; lỗi thì rollback, không để schema nửa vời.
 * - Ghi nhận file đã áp vào bảng _app_migrations nên chạy lại không nhân đôi.
 * - Không in DATABASE_URL ra log (chỉ in host/database).
 *
 * Cách chạy:
 *   npx tsx scripts/apply-migrations.ts          # áp migration còn thiếu
 *   npx tsx scripts/apply-migrations.ts --dry    # chỉ liệt kê, không ghi
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import { loadEnvConfig } from "@next/env";
import { resolveMigrationTarget } from "./migration-target-policy.mjs";
import { getDatabaseUrl, validatePreviewDatabase } from "./verify-preview-database.mjs";
import { validateProductionDatabase } from "./verify-production-database.mjs";

loadEnvConfig(process.cwd());

const DRY_RUN = process.argv.includes("--dry");

function describeTarget(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return `${parsed.hostname}${parsed.port ? `:${parsed.port}` : ""}/${parsed.pathname.replace(/^\//, "")}`;
  } catch {
    return "(DATABASE_URL không hợp lệ)";
  }
}

async function main(): Promise<void> {
  const migrationTarget = resolveMigrationTarget(process.env, process.argv.slice(2));
  if (migrationTarget === "preview") validatePreviewDatabase(process.env);
  if (migrationTarget === "production") validateProductionDatabase(process.env);
  const connectionString = getDatabaseUrl(process.env);
  if (!connectionString) {
    throw new Error("Thiếu biến URL database phù hợp với môi trường. Preview dùng PREVIEW_DATABASE_URL; các môi trường khác dùng DATABASE_URL.");
  }

  console.log(`[migrate] Môi trường: ${migrationTarget}`);
  console.log(`[migrate] Đích: ${describeTarget(connectionString)}${DRY_RUN ? " (dry-run)" : ""}`);

  const pool = new Pool({ connectionString, max: 1 });
  const client = await pool.connect();

  try {
    if (!DRY_RUN) {
      await client.query(`
        CREATE TABLE IF NOT EXISTS _app_migrations (
          filename text PRIMARY KEY,
          applied_at timestamptz NOT NULL DEFAULT now()
        )
      `);
    }

    const migrationTable = await client.query<{ name: string | null }>(
      "SELECT to_regclass($1) AS name",
      ["_app_migrations"],
    );
    const applied = new Set<string>();
    if (migrationTable.rows[0]?.name) {
      const rows = await client.query<{ filename: string }>(
        "SELECT filename FROM _app_migrations",
      );
      for (const row of rows.rows) applied.add(row.filename);
    }

    const dir = path.join(process.cwd(), "drizzle");
    const files = (await readdir(dir))
      .filter((name) => name.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    if (files.length === 0) {
      console.log("[migrate] Không có file .sql nào trong drizzle/.");
      return;
    }

    let appliedCount = 0;
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] BỎ QUA (đã áp): ${file}`);
        continue;
      }

      if (DRY_RUN) {
        console.log(`[migrate] SẼ ÁP: ${file}`);
        continue;
      }

      const sql = await readFile(path.join(dir, file), "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query("INSERT INTO _app_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
        appliedCount += 1;
        console.log(`[migrate] ĐÃ ÁP: ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`Áp migration ${file} thất bại: ${(error as Error).message}`);
      }
    }

    console.log(
      DRY_RUN
        ? "[migrate] Dry-run xong, chưa ghi gì."
        : `[migrate] Hoàn tất: ${appliedCount} file mới, ${files.length} file tổng.`,
    );
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`[migrate] LỖI: ${(error as Error).message}`);
  process.exitCode = 1;
});
