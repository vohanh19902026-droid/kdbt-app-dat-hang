ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'TECHNICAL';

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS pour_method text,
  ADD COLUMN IF NOT EXISTS site_category text;

UPDATE app_settings AS settings
SET settings_json = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(settings_json, '{catalog}', COALESCE(settings_json->'catalog', '{}'::jsonb), true),
      '{catalog,pourMethods}', COALESCE(settings_json #> '{catalog,pourMethods}', '["Đổ xả", "Bơm"]'::jsonb), true),
    '{catalog,siteCategories}', COALESCE(settings_json #> '{catalog,siteCategories}', '["Dự án", "Dân cư"]'::jsonb), true),
  '{catalog,pourTypes}', (
  SELECT jsonb_agg(to_jsonb(value) ORDER BY value)
  FROM (
    SELECT DISTINCT value FROM (
      SELECT item AS value FROM jsonb_array_elements_text(COALESCE(settings.settings_json #> '{catalog,pourTypes}', '[]'::jsonb)) AS old(item)
      UNION ALL SELECT unnest(ARRAY['Sàn', 'Mái', 'Móng', 'Móng đơn', 'Móng bè', 'Móng băng', 'Cột', 'Dầm', 'Tường', 'Khác']::text[])
    ) AS choices
  ) AS deduplicated
), true), updated_at = now()
WHERE settings.id = 'default';
