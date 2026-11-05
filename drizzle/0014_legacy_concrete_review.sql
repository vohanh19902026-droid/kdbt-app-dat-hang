-- Historical KDBT report data is an immutable, review-only snapshot store.
-- It is deliberately separate from customers and the operational receivable ledger.
CREATE TABLE IF NOT EXISTS legacy_import_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manifest_sha256 text NOT NULL UNIQUE,
  period_from date NOT NULL,
  period_to date NOT NULL,
  source_workbook_count integer NOT NULL CHECK (source_workbook_count > 0),
  mapping_version text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING_HUMAN_REVIEW'
    CHECK (status IN ('PENDING_HUMAN_REVIEW', 'APPROVED_FOR_REFERENCE', 'REJECTED')),
  source_observation_count integer NOT NULL DEFAULT 0,
  imported_by text REFERENCES "user"(id) ON DELETE SET NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS legacy_sales_roster (
  id text PRIMARY KEY,
  segment text NOT NULL CHECK (segment IN ('DA', 'DC')),
  display_name text NOT NULL,
  normalized_name text NOT NULL,
  observed_months integer NOT NULL DEFAULT 0 CHECK (observed_months >= 0),
  review_status text NOT NULL DEFAULT 'NEEDS_EMPLOYER_CONFIRMATION'
    CHECK (review_status IN ('NEEDS_EMPLOYER_CONFIRMATION', 'CONFIRMED_CURRENT', 'NOT_CURRENT', 'DUPLICATE')),
  mapped_user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (segment, normalized_name)
);
CREATE INDEX IF NOT EXISTS legacy_sales_roster_user_idx ON legacy_sales_roster(mapped_user_id);

CREATE TABLE IF NOT EXISTS legacy_sales_roster_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roster_id text NOT NULL REFERENCES legacy_sales_roster(id) ON DELETE CASCADE,
  report_month integer NOT NULL CHECK (report_month BETWEEN 1 AND 12),
  source_file text NOT NULL,
  source_sha256 text NOT NULL,
  source_sheet text NOT NULL CHECK (source_sheet IN ('PKDBT- DA', 'PKDBT DC')),
  source_cell text NOT NULL,
  source_name text NOT NULL,
  fill_color_type text NOT NULL,
  fill_color text NOT NULL,
  classification text NOT NULL DEFAULT 'SALES_NAME',
  UNIQUE (source_sha256, source_sheet, source_cell)
);
CREATE INDEX IF NOT EXISTS legacy_sales_roster_evidence_roster_idx ON legacy_sales_roster_evidence(roster_id, report_month);

CREATE TABLE IF NOT EXISTS legacy_customer_entities (
  entity_key text PRIMARY KEY,
  segment text NOT NULL CHECK (segment IN ('DA', 'DC')),
  identity_key_quality text NOT NULL,
  review_status text NOT NULL DEFAULT 'PENDING_HUMAN_REVIEW',
  linked_customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  reviewed_by text REFERENCES "user"(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS legacy_customer_entities_link_idx ON legacy_customer_entities(linked_customer_id);

CREATE TABLE IF NOT EXISTS legacy_debt_observations (
  observation_id text PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES legacy_import_batches(id) ON DELETE RESTRICT,
  entity_key text NOT NULL REFERENCES legacy_customer_entities(entity_key) ON DELETE RESTRICT,
  segment text NOT NULL CHECK (segment IN ('DA', 'DC')),
  report_month date NOT NULL,
  source_file text NOT NULL,
  source_sha256 text NOT NULL,
  source_sheet text NOT NULL CHECK (source_sheet IN ('PKDBT- DA', 'PKDBT DC')),
  source_row integer NOT NULL CHECK (source_row > 0),
  source_range text,
  source_name text NOT NULL,
  source_project_name text,
  source_address text,
  source_phone text,
  source_customer_code text,
  source_sales_code text,
  source_salesperson text,
  roster_id text REFERENCES legacy_sales_roster(id) ON DELETE SET NULL,
  opening_raw text,
  opening_value numeric(20, 3),
  revenue_raw text,
  revenue_value numeric(20, 3),
  receipts_raw text,
  receipts_value numeric(20, 3),
  closing_raw text,
  closing_value numeric(20, 3),
  opening_cell text,
  revenue_cell text,
  receipts_cell text,
  closing_cell text,
  residual numeric(20, 3),
  reconciliation_status text NOT NULL DEFAULT 'UNREVIEWED',
  unit_status text NOT NULL DEFAULT 'UNCONFIRMED_SOURCE_UNIT',
  identity_key_quality text NOT NULL,
  review_status text NOT NULL DEFAULT 'PENDING_HUMAN_REVIEW',
  mapping_version text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (source_sha256, source_sheet, source_row, mapping_version)
);
CREATE INDEX IF NOT EXISTS legacy_debt_observations_month_idx ON legacy_debt_observations(report_month, segment);
CREATE INDEX IF NOT EXISTS legacy_debt_observations_entity_idx ON legacy_debt_observations(entity_key, report_month);
CREATE INDEX IF NOT EXISTS legacy_debt_observations_roster_idx ON legacy_debt_observations(roster_id, report_month);
CREATE INDEX IF NOT EXISTS legacy_debt_observations_source_name_idx ON legacy_debt_observations ((lower(source_name)) text_pattern_ops);

CREATE TABLE IF NOT EXISTS legacy_debt_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  observation_id text NOT NULL REFERENCES legacy_debt_observations(observation_id) ON DELETE RESTRICT,
  actor_user_id text NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  decision text NOT NULL CHECK (decision IN ('CONFIRMED', 'NEEDS_CORRECTION', 'REJECTED')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS legacy_debt_review_events_observation_idx ON legacy_debt_review_events(observation_id, created_at);
