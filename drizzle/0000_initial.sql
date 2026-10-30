CREATE TYPE app_role AS ENUM ('ADMIN', 'PLANNER', 'SALES', 'ACCOUNTANT');
CREATE TYPE order_status AS ENUM ('PENDING', 'APPROVED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE SEQUENCE booking_number_seq START WITH 7431 INCREMENT BY 1;

CREATE TABLE "user" (
  id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
  email_verified boolean NOT NULL DEFAULT false, image text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  role text DEFAULT 'user', banned boolean DEFAULT false, ban_reason text, ban_expires timestamptz,
  app_role app_role NOT NULL DEFAULT 'SALES', is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE session (
  id text PRIMARY KEY, expires_at timestamptz NOT NULL, token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text, user_agent text, user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  impersonated_by text
);
CREATE INDEX session_user_id_idx ON session(user_id);
CREATE TABLE account (
  id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token text, refresh_token text, id_token text, access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz, scope text, password text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX account_user_id_idx ON account(user_id);
CREATE TABLE verification (
  id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL, expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL, phone text, default_address text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);
CREATE INDEX customers_name_idx ON customers(name);
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_no text NOT NULL DEFAULT ('BOOK-' || nextval('booking_number_seq')::text),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL, sales_rep_name text NOT NULL, site_address text NOT NULL,
  contact_name text, contact_phone text, requested_at timestamptz NOT NULL,
  planned_start_at timestamptz, planned_end_at timestamptz,
  quantity_m3 numeric(10,2) NOT NULL, actual_m3 numeric(10,2) NOT NULL DEFAULT 0,
  grade text NOT NULL, sand_type text NOT NULL, stone_type text NOT NULL,
  pump_required text NOT NULL, pump_operator text, assigned_vehicle text,
  truck_capacity_m3 numeric(5,2), pour_type text, sales_note text, planning_note text,
  status order_status NOT NULL DEFAULT 'PENDING',
  created_by text NOT NULL REFERENCES "user"(id), approved_by text REFERENCES "user"(id), approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
  version numeric(10,0) NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX orders_booking_no_idx ON orders(booking_no);
CREATE INDEX orders_requested_at_idx ON orders(requested_at);
CREATE INDEX orders_status_requested_idx ON orders(status, requested_at);
CREATE INDEX orders_creator_created_idx ON orders(created_by, created_at);
CREATE TABLE order_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  actor_user_id text NOT NULL REFERENCES "user"(id), event_type text NOT NULL, field_name text,
  old_value text, new_value text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX order_events_order_created_idx ON order_events(order_id, created_at);
CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), kind text NOT NULL, code text NOT NULL,
  name text NOT NULL, is_active boolean NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX materials_kind_code_idx ON materials(kind, code);