ALTER TABLE customers ADD COLUMN sales_rep_id text REFERENCES "user"(id) ON DELETE SET NULL;
CREATE INDEX customers_sales_rep_idx ON customers(sales_rep_id);

-- Backfill only when historical orders identify exactly one active salesperson as the owner.
WITH unambiguous_owners AS (
  SELECT o.customer_id, MIN(o.created_by) AS sales_rep_id
  FROM orders o
  JOIN "user" u ON u.id = o.created_by AND u.app_role = 'SALES' AND u.is_active = true
  WHERE o.customer_id IS NOT NULL
  GROUP BY o.customer_id
  HAVING COUNT(DISTINCT o.created_by) = 1
)
UPDATE customers c
SET sales_rep_id = owner.sales_rep_id
FROM unambiguous_owners owner
WHERE c.id = owner.customer_id AND c.sales_rep_id IS NULL;
