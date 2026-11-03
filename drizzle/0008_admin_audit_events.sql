CREATE TABLE IF NOT EXISTS admin_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id text NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  entity_type text NOT NULL,
  entity_key text NOT NULL,
  old_value text,
  new_value text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_events_created_idx ON admin_audit_events (created_at);
CREATE INDEX IF NOT EXISTS admin_audit_events_actor_created_idx ON admin_audit_events (actor_user_id, created_at);
