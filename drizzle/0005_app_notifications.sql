CREATE TABLE IF NOT EXISTS app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_event_id uuid REFERENCES order_events(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS app_notifications_recipient_created_idx
  ON app_notifications(recipient_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_notifications_recipient_unread_idx
  ON app_notifications(recipient_user_id, read_at);
