WITH current AS (
  SELECT id, COALESCE(settings_json->'catalog', '{}'::jsonb) AS catalog
  FROM app_settings
  WHERE id = 'default'
), normalized AS (
  SELECT id, catalog || jsonb_build_object(
    'grades', CASE WHEN jsonb_typeof(catalog->'grades') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'grades') > 0 THEN catalog->'grades' ELSE '["250 (12+2)", "250R (14+2)", "300 (12+2)", "300R (7+12)", "C30 (12+2)", "B35 (19+1)"]'::jsonb END ELSE '["250 (12+2)", "250R (14+2)", "300 (12+2)", "300R (7+12)", "C30 (12+2)", "B35 (19+1)"]'::jsonb END,
    'sandTypes', CASE WHEN jsonb_typeof(catalog->'sandTypes') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'sandTypes') > 0 THEN catalog->'sandTypes' ELSE '["Cát Lọc", "Cát vàng", "Cát nghiền", "Cát sông"]'::jsonb END ELSE '["Cát Lọc", "Cát vàng", "Cát nghiền", "Cát sông"]'::jsonb END,
    'stoneTypes', CASE WHEN jsonb_typeof(catalog->'stoneTypes') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'stoneTypes') > 0 THEN catalog->'stoneTypes' ELSE '["Đá 1x2", "Đá 0.5x1", "Đá 2x4", "Đá mi"]'::jsonb END ELSE '["Đá 1x2", "Đá 0.5x1", "Đá 2x4", "Đá mi"]'::jsonb END,
    'pumpTypes', CASE WHEN jsonb_typeof(catalog->'pumpTypes') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'pumpTypes') > 0 THEN catalog->'pumpTypes' ELSE '["Bơm cần 38m", "Bơm 42m", "Bơm 50m", "Bơm 63m", "Bơm tĩnh", "Không bơm"]'::jsonb END ELSE '["Bơm cần 38m", "Bơm 42m", "Bơm 50m", "Bơm 63m", "Bơm tĩnh", "Không bơm"]'::jsonb END,
    'serviceVehicles', CASE WHEN jsonb_typeof(catalog->'serviceVehicles') = 'array' THEN catalog->'serviceVehicles' ELSE '[]'::jsonb END,
    'truckCapacitiesM3', CASE WHEN jsonb_typeof(catalog->'truckCapacitiesM3') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'truckCapacitiesM3') > 0 THEN catalog->'truckCapacitiesM3' ELSE '[5, 7, 10]'::jsonb END ELSE '[5, 7, 10]'::jsonb END,
    'pourTypes', CASE WHEN jsonb_typeof(catalog->'pourTypes') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'pourTypes') > 0 THEN catalog->'pourTypes' ELSE '["Sàn", "Mái", "Móng", "Móng đơn", "Móng bè", "Móng băng", "Cột", "Dầm", "Tường", "Khác"]'::jsonb END ELSE '["Sàn", "Mái", "Móng", "Móng đơn", "Móng bè", "Móng băng", "Cột", "Dầm", "Tường", "Khác"]'::jsonb END,
    'pourMethods', CASE WHEN jsonb_typeof(catalog->'pourMethods') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'pourMethods') > 0 THEN catalog->'pourMethods' ELSE '["Đổ xả", "Bơm"]'::jsonb END ELSE '["Đổ xả", "Bơm"]'::jsonb END,
    'siteCategories', CASE WHEN jsonb_typeof(catalog->'siteCategories') = 'array' THEN CASE WHEN jsonb_array_length(catalog->'siteCategories') > 0 THEN catalog->'siteCategories' ELSE '["Dự án", "Dân cư"]'::jsonb END ELSE '["Dự án", "Dân cư"]'::jsonb END
  ) AS catalog
  FROM current
)
UPDATE app_settings AS settings
SET settings_json = jsonb_set(settings.settings_json, '{catalog}', normalized.catalog, true), updated_at = now()
FROM normalized
WHERE settings.id = normalized.id;
