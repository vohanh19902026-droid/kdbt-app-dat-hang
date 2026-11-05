ALTER TABLE "user"
  ADD COLUMN IF NOT EXISTS is_platform_owner boolean NOT NULL DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS user_single_platform_owner_idx
  ON "user" (is_platform_owner)
  WHERE is_platform_owner = true;
