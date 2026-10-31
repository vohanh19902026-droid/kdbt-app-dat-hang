-- Additive-only migration: index for queries that group orders by planned day.
-- Used by /orders?view=planning, /reports and /api/exports/xlsx.
CREATE INDEX IF NOT EXISTS orders_planning_basis_idx
  ON orders ((COALESCE(planned_start_at, requested_at)));
