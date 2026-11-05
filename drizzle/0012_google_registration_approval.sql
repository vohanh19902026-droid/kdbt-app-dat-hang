ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS requested_app_role app_role;
