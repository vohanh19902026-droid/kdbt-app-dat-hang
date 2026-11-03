CREATE TABLE IF NOT EXISTS usage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  route text NOT NULL,
  transfer_bytes numeric(14, 0) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS usage_events_created_idx ON usage_events (created_at);
CREATE INDEX IF NOT EXISTS usage_events_user_created_idx ON usage_events (user_id, created_at);
