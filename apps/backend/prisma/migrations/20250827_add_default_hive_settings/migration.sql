-- Add default settings to existing hives that don't have settings
UPDATE "Hive"
SET "settings" = '{
  "autumnFeeding": {
    "startMonth": 8,
    "endMonth": 10,
    "amountKg": 12
  },
  "inspection": {
    "frequencyDays": 7
  }
}'::jsonb
WHERE "settings" IS NULL;