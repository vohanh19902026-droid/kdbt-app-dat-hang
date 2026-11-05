UPDATE app_settings AS settings
SET settings_json = jsonb_set(
  settings.settings_json,
  '{catalog,sandTypes}',
  (
    SELECT jsonb_agg(
      CASE WHEN value = '"Cát Lọc"'::jsonb THEN '"Cát Lộc"'::jsonb ELSE value END
      ORDER BY ordinal
    )
    FROM jsonb_array_elements(settings.settings_json #> '{catalog,sandTypes}') WITH ORDINALITY AS item(value, ordinal)
  ),
  true
),
updated_at = now()
WHERE jsonb_typeof(settings.settings_json #> '{catalog,sandTypes}') = 'array'
  AND settings.settings_json #> '{catalog,sandTypes}' @> '["Cát Lọc"]'::jsonb;
