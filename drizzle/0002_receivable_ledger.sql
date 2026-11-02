-- Append-only receivable/payment records for the accountant workspace.
CREATE TYPE receivable_entry_type AS ENUM ('CHARGE', 'PAYMENT');

CREATE TABLE receivable_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  entry_type receivable_entry_type NOT NULL,
  amount_vnd numeric(15, 0) NOT NULL CHECK (amount_vnd > 0),
  reference_no text,
  occurred_at timestamptz NOT NULL,
  note text,
  created_by text NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX receivable_entries_customer_date_idx
  ON receivable_entries (customer_id, occurred_at DESC);
CREATE INDEX receivable_entries_date_idx
  ON receivable_entries (occurred_at DESC);
CREATE INDEX receivable_entries_order_idx
  ON receivable_entries (order_id);
