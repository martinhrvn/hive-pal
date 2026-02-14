-- Add missing built-in frame sizes for B hive
INSERT INTO "FrameSize" ("id", "name", "width", "height", "depth", "isBuiltIn", "status", "createdAt", "updatedAt") VALUES
  (gen_random_uuid(), 'B Deep', 356, 216, 35, true, 'APPROVED', NOW(), NOW()),
  (gen_random_uuid(), 'B Shallow', 356, 140, 35, true, 'APPROVED', NOW(), NOW());

-- Backfill frameSizeId on existing boxes based on variant
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'Langstroth Deep' LIMIT 1) WHERE variant = 'LANGSTROTH_DEEP' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'Langstroth Shallow' LIMIT 1) WHERE variant = 'LANGSTROTH_SHALLOW' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'B Deep' LIMIT 1) WHERE variant = 'B_DEEP' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'B Shallow' LIMIT 1) WHERE variant = 'B_SHALLOW' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'Dadant' LIMIT 1) WHERE variant = 'DADANT' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'National Deep' LIMIT 1) WHERE variant = 'NATIONAL_DEEP' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'National Shallow' LIMIT 1) WHERE variant = 'NATIONAL_SHALLOW' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'Warré' LIMIT 1) WHERE variant = 'WARRE' AND "frameSizeId" IS NULL;
UPDATE "Box" SET "frameSizeId" = (SELECT id FROM "FrameSize" WHERE name = 'Top Bar' LIMIT 1) WHERE variant = 'TOP_BAR' AND "frameSizeId" IS NULL;
