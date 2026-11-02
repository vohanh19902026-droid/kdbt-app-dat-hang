ALTER TABLE "user"
  ADD COLUMN employee_code text,
  ADD COLUMN phone text,
  ADD COLUMN department text,
  ADD COLUMN monthly_target_m3 numeric(10, 2);

CREATE TABLE app_settings (
  id text PRIMARY KEY DEFAULT 'default',
  settings_json jsonb NOT NULL,
  updated_by text REFERENCES "user"(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO app_settings (id, settings_json)
VALUES ('default', '{"companyName":"CENCOM","companySubtitle":"ĐIỀU PHỐI BÊ TÔNG","companyPhone":"","companyEmail":"","companyAddress":"","themeMode":"light","accentColor":"green","fontFamily":"dm-sans","fontScale":100}'::jsonb)
ON CONFLICT (id) DO NOTHING;
