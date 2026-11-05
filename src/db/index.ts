import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { getDbPoolMax } from "@/lib/db-pool-config";
import { validatePreviewDatabase } from "../../scripts/verify-preview-database.mjs";

if (process.env.VERCEL_ENV === "preview") validatePreviewDatabase(process.env);

const globalForDb = globalThis as unknown as { pool?: Pool };
const pool = globalForDb.pool ?? new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://missing:missing@localhost:5432/cencom",
  max: getDbPoolMax(),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
});
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
