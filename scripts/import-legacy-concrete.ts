import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Pool, type PoolClient } from "pg";

type Row = Record<string, string>;
type RosterCandidate = {
  display_name: string;
  segment: "DA" | "DC";
  observed_months: number;
  month_list: string;
};
type RosterEvidence = {
  name: string;
  segment: "DA" | "DC";
  source_sheet: "PKDBT- DA" | "PKDBT DC";
  month: number;
  workbook: string;
  sha256: string;
  cell: string;
  fill_color_type?: string;
  fill_color?: string;
  classification?: string;
};

const MAPPING_VERSION = "cencom-kdbt-legacy-v1";
const ALLOWED_SHEETS = new Set(["PKDBT- DA", "PKDBT DC"]);
const TARGET_ENV = "PREVIEW";

function parseArgs(): { sourceDir: string; apply: boolean } {
  const args = process.argv.slice(2);
  const sourceIndex = args.indexOf("--source-dir");
  const sourceDir = sourceIndex >= 0 ? args[sourceIndex + 1] : process.env.LEGACY_SOURCE_DIR;
  if (!sourceDir) throw new Error("Pass --source-dir <private _review_private path> or set LEGACY_SOURCE_DIR.");
  if (args.includes("--apply") && args.includes("--dry-run")) throw new Error("Choose either --apply or --dry-run.");
  return { sourceDir: path.resolve(sourceDir), apply: args.includes("--apply") };
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field.length === 0) quoted = true;
    else if (char === ",") { row.push(field); field = ""; }
    else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(field); field = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function toRecords(text: string, fileName: string): Row[] {
  const [header, ...rows] = parseCsv(text);
  if (!header?.length) throw new Error(`${fileName} has no header row.`);
  return rows.map((values, rowIndex) => {
    if (values.length !== header.length) throw new Error(`${fileName} row ${rowIndex + 2} has ${values.length} cells; expected ${header.length}.`);
    return Object.fromEntries(header.map((key, index) => [key, values[index]]));
  });
}

function normalizeName(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function rosterId(segment: string, name: string): string {
  const normalized = normalizeName(name);
  return `${segment}_${createHash("sha256").update(normalized).digest("hex").slice(0, 24)}`;
}

function nullable(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" ? null : trimmed;
}

function decimalOrNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!/^-?\d+(?:\.\d{1,3})?$/.test(trimmed)) return null;
  return trimmed;
}

function requirePreviewWriteConsent(): void {
  const target = process.env.LEGACY_IMPORT_TARGET_ENV?.toUpperCase();
  const confirmation = process.env.LEGACY_IMPORT_CONFIRM_TARGET_ENV?.toUpperCase();
  if (target !== TARGET_ENV || confirmation !== TARGET_ENV) {
    throw new Error("Import writes require LEGACY_IMPORT_TARGET_ENV=PREVIEW and LEGACY_IMPORT_CONFIRM_TARGET_ENV=PREVIEW.");
  }
  if (process.env.LEGACY_IMPORT_ALLOW_WRITE !== "YES") throw new Error("Set LEGACY_IMPORT_ALLOW_WRITE=YES only after confirming the isolated Preview database.");
  const databaseUrl = process.env.PREVIEW_DATABASE_URL;
  if (!databaseUrl) throw new Error("PREVIEW_DATABASE_URL is required for --apply.");
  const url = new URL(databaseUrl);
  const actualDatabase = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const actualEndpoint = url.hostname.split(".")[0]?.replace(/-pooler$/, "");
  const actualProject = process.env.DATABASE_NEON_PROJECT_ID || process.env.NEON_PROJECT_ID;
  const expectedProject = process.env.LEGACY_IMPORT_EXPECTED_NEON_PROJECT_ID;
  if (!url.hostname.endsWith(".neon.tech") ||
      actualDatabase !== process.env.LEGACY_IMPORT_EXPECTED_DATABASE ||
      actualDatabase !== process.env.PREVIEW_DATABASE_NAME ||
      actualEndpoint !== process.env.LEGACY_IMPORT_EXPECTED_NEON_ENDPOINT_ID ||
      !expectedProject || expectedProject !== actualProject ||
      expectedProject !== process.env.PREVIEW_DATABASE_PROJECT_ID) {
    throw new Error("Refusing import: Neon host, endpoint, database, and Preview project must all match the separately confirmed target.");
  }
}

async function sha256File(filePath: string): Promise<string> {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function insertRows(client: PoolClient, table: string, columns: string[], rows: unknown[][], conflict: string): Promise<number> {
  let inserted = 0;
  const chunkSize = 250;
  for (let start = 0; start < rows.length; start += chunkSize) {
    const chunk = rows.slice(start, start + chunkSize);
    const values: unknown[] = [];
    const tuples = chunk.map((row) => `(${row.map((value) => { values.push(value); return `$${values.length}`; }).join(",")})`);
    const result = await client.query(
      `INSERT INTO ${table} (${columns.join(",")}) VALUES ${tuples.join(",")} ${conflict}`,
      values,
    );
    inserted += result.rowCount ?? 0;
  }
  return inserted;
}

async function main(): Promise<void> {
  const { sourceDir, apply } = parseArgs();
  const [rosterText, customerText, debtText] = await Promise.all([
    readFile(path.join(sourceDir, "sales-roster-yellow-corrected-data.json"), "utf8"),
    readFile(path.join(sourceDir, "customer-observations.csv"), "utf8"),
    readFile(path.join(sourceDir, "debt-snapshots.csv"), "utf8"),
  ]);
  const roster = JSON.parse(rosterText) as {
    source_workbooks: number;
    candidate_count: number;
    observation_count: number;
    candidates: RosterCandidate[];
    observations: RosterEvidence[];
  };
  const observations = toRecords(customerText, "customer-observations.csv");
  const snapshots = toRecords(debtText, "debt-snapshots.csv");
  if (roster.source_workbooks !== 9 || roster.candidate_count !== roster.candidates.length || roster.observation_count !== roster.observations.length) {
    throw new Error("Corrected roster counts do not match their records.");
  }
  if (roster.candidates.length !== 22 || roster.observations.length !== 216) throw new Error("Unexpected corrected roster count; stop for human review.");
  if (roster.observations.some((entry) => !ALLOWED_SHEETS.has(entry.source_sheet) || entry.fill_color_type !== "theme" || entry.fill_color !== "9")) {
    throw new Error("Roster contains a non-KDBT sheet or an unverified name-cell fill; stop before import.");
  }
  if (observations.length !== 8243 || snapshots.length !== observations.length) throw new Error("Observation/snapshot counts changed; stop for source review.");

  const workbookHashes = new Map<string, string>();
  for (const evidence of roster.observations) {
    const previous = workbookHashes.get(evidence.workbook);
    if (previous && previous !== evidence.sha256) throw new Error(`Conflicting source hashes for ${evidence.workbook}.`);
    workbookHashes.set(evidence.workbook, evidence.sha256.toLowerCase());
  }
  if (workbookHashes.size !== roster.source_workbooks) throw new Error("Roster evidence does not cover the declared source workbook count.");
  for (const [file, expectedHash] of workbookHashes) {
    const actualHash = await sha256File(path.join(sourceDir, "..", file));
    if (actualHash !== expectedHash) throw new Error(`Source workbook SHA-256 mismatch: ${file}.`);
  }

  const snapshotByObservation = new Map(snapshots.map((row) => [row.obs_id, row]));
  if (snapshotByObservation.size !== snapshots.length) throw new Error("Duplicate snapshot observation ID detected.");
  const rosterByName = new Map(roster.candidates.map((candidate) => [`${candidate.segment}|${normalizeName(candidate.display_name)}`, candidate]));
  const unmatchedRepLabels = new Set<string>();
  for (const row of observations) {
    if (!ALLOWED_SHEETS.has(row.source_sheet) || !["DA", "DC"].includes(row.segment)) throw new Error("A customer observation references a non-KDBT source sheet.");
    if (row.source_salesperson && !rosterByName.has(`${row.segment}|${normalizeName(row.source_salesperson)}`)) unmatchedRepLabels.add(`${row.segment}|${normalizeName(row.source_salesperson)}`);
    if (!snapshotByObservation.has(row.obs_id)) throw new Error(`Missing debt snapshot for observation ${row.obs_id}.`);
  }
  if (unmatchedRepLabels.size) throw new Error(`${unmatchedRepLabels.size} source salesperson label(s) do not match the corrected yellow roster; stop for manual mapping.`);
  const workbookManifestHash = createHash("sha256").update(`${MAPPING_VERSION}\n${[...workbookHashes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([file, hash]) => `${file}:${hash}`).join("\n")}`).digest("hex");

  const distinctEntities = new Map<string, Row>();
  for (const row of observations) if (!distinctEntities.has(row.entity_key)) distinctEntities.set(row.entity_key, row);
  const sourceRepRows = observations.filter((row) => Boolean(row.source_salesperson)).length;
  console.log(`[legacy-import] Target: ${apply ? "Preview (explicit write)" : "dry-run only"}`);
  console.log(`[legacy-import] manifest=${workbookManifestHash}; source_workbooks=${workbookHashes.size}; roster=${roster.candidates.length}; roster_evidence=${roster.observations.length}; entities=${distinctEntities.size}; observations=${observations.length}; debt_snapshots=${snapshots.length}; observations_with_salesperson=${sourceRepRows}`);
  console.log("[legacy-import] All imported observations remain PENDING_HUMAN_REVIEW; source units remain UNCONFIRMED_SOURCE_UNIT. No operational customers or receivable entries are created.");
  if (!apply) return;
  requirePreviewWriteConsent();

  const pool = new Pool({ connectionString: process.env.PREVIEW_DATABASE_URL, max: 1, application_name: "cencom-legacy-preview-import" });
  const client = await pool.connect();
  try {
    const migration = await client.query<{ present: string | null }>("SELECT to_regclass('legacy_debt_observations') AS present");
    if (!migration.rows[0]?.present) throw new Error("Migration 0014 is not present in the selected database.");
    await client.query("BEGIN");
    const batchResult = await client.query<{ id: string }>(
      `INSERT INTO legacy_import_batches (manifest_sha256, period_from, period_to, source_workbook_count, mapping_version, source_observation_count)
       VALUES ($1, DATE '2026-01-01', DATE '2026-09-30', $2, $3, $4)
       ON CONFLICT (manifest_sha256) DO UPDATE SET source_observation_count = EXCLUDED.source_observation_count
       RETURNING id`,
      [workbookManifestHash, workbookHashes.size, MAPPING_VERSION, observations.length],
    );
    const batchId = batchResult.rows[0].id;

    const rosterRows = roster.candidates.map((candidate) => {
      const normalizedName = normalizeName(candidate.display_name);
      return [rosterId(candidate.segment, candidate.display_name), candidate.segment, candidate.display_name,
        normalizedName, candidate.observed_months];
    });
    await insertRows(client, "legacy_sales_roster", ["id", "segment", "display_name", "normalized_name", "observed_months"], rosterRows,
      "ON CONFLICT (id) DO NOTHING");

    const evidenceRows = roster.observations.map((evidence) => [
      rosterId(evidence.segment, evidence.name), evidence.month, evidence.workbook, evidence.sha256,
      evidence.source_sheet, evidence.cell, evidence.name, evidence.fill_color_type, evidence.fill_color,
      evidence.classification || "SALES_NAME",
    ]);
    await insertRows(client, "legacy_sales_roster_evidence", ["roster_id", "report_month", "source_file", "source_sha256", "source_sheet", "source_cell", "source_name", "fill_color_type", "fill_color", "classification"], evidenceRows,
      "ON CONFLICT (source_sha256, source_sheet, source_cell) DO NOTHING");

    const entityRows = [...distinctEntities.values()].map((row) => [row.entity_key, row.segment, row.identity_key_quality || "UNASSESSED"]);
    await insertRows(client, "legacy_customer_entities", ["entity_key", "segment", "identity_key_quality"], entityRows,
      "ON CONFLICT (entity_key) DO NOTHING");

    const observationColumns = [
      "observation_id", "batch_id", "entity_key", "segment", "report_month", "source_file", "source_sha256",
      "source_sheet", "source_row", "source_range", "source_name", "source_project_name", "source_address",
      "source_phone", "source_customer_code", "source_sales_code", "source_salesperson", "roster_id",
      "opening_raw", "opening_value", "revenue_raw", "revenue_value", "receipts_raw", "receipts_value",
      "closing_raw", "closing_value", "opening_cell", "revenue_cell", "receipts_cell", "closing_cell",
      "residual", "reconciliation_status", "unit_status", "identity_key_quality", "mapping_version",
    ];
    const observationRows = observations.map((row) => {
      const snapshot = snapshotByObservation.get(row.obs_id)!;
      const candidate = row.source_salesperson ? rosterByName.get(`${row.segment}|${normalizeName(row.source_salesperson)}`) : undefined;
      const rosterKey = candidate ? rosterId(candidate.segment, candidate.display_name) : null;
      const reportMonth = `2026-${String(Number(row.month)).padStart(2, "0")}-01`;
      return [row.obs_id, batchId, row.entity_key, row.segment, reportMonth, row.source_file, row.source_sha256,
        row.source_sheet, Number(row.source_row), nullable(row.source_range), row.source_name, nullable(row.source_project_name),
        nullable(row.source_address), nullable(row.source_phone), nullable(row.source_customer_code), nullable(row.source_sales_code),
        nullable(row.source_salesperson), rosterKey, nullable(row.opening_balance_raw), decimalOrNull(row.opening_balance_value),
        nullable(row.revenue_raw), decimalOrNull(row.revenue_value), nullable(row.receipt_raw), decimalOrNull(row.receipt_value),
        nullable(row.closing_balance_raw), decimalOrNull(row.closing_balance_value), nullable(snapshot.opening_cell),
        nullable(snapshot.revenue_cell), nullable(snapshot.receipts_cell), nullable(snapshot.closing_cell),
        decimalOrNull(snapshot.residual), snapshot.check_status || "UNREVIEWED", snapshot.unit_status || "UNCONFIRMED_SOURCE_UNIT",
        row.identity_key_quality || "UNASSESSED", MAPPING_VERSION];
    });
    const inserted = await insertRows(client, "legacy_debt_observations", observationColumns, observationRows,
      "ON CONFLICT (source_sha256, source_sheet, source_row, mapping_version) DO NOTHING");
    await client.query("COMMIT");
    console.log(`[legacy-import] committed batch=${batchId}; newly_inserted_observations=${inserted}; input_observations=${observations.length}`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(`[legacy-import] ${error instanceof Error ? error.message : "Import failed."}`);
  process.exitCode = 1;
});
