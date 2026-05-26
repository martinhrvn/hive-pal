-- Add standard equipment items across BOXES, HIVE_PARTS, TOOLS, PROTECTIVE, and EXTRACTION categories.
-- Existing items (DEEP_BOX, MEDIUM_BOX, SHALLOW_BOX, BOTTOM_BOARD, COVER, QUEEN_EXCLUDER,
-- FRAMES, FEEDER, SUGAR, SYRUP) are unchanged.

-- Update seed function to include new items for future registrations
CREATE OR REPLACE FUNCTION create_default_equipment_items(user_id_param TEXT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO "EquipmentMultiplier" (id, "userId", "targetHives", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), user_id_param, 0, NOW(), NOW())
  ON CONFLICT ("userId") DO NOTHING;

  INSERT INTO "EquipmentItem" (id, "userId", "itemId", name, enabled, "perHive", extra, "inExtraction", damaged, "neededOverride", category, scope, unit, "isCustom", "displayOrder", "createdAt", "updatedAt")
  VALUES
    -- BOXES
    (gen_random_uuid(), user_id_param, 'DEEP_BOX',      'Deep Boxes',         true,  1, 0, 0, 0, null, 'BOXES',      'PER_HIVE', 'pieces', false,  1, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'MEDIUM_BOX',    'Medium Boxes',       true,  0, 0, 0, 0, null, 'BOXES',      'PER_HIVE', 'pieces', false,  2, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'SHALLOW_BOX',   'Shallow Boxes',      true,  2, 0, 0, 0, null, 'BOXES',      'PER_HIVE', 'pieces', false,  3, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'NUC_BOX',       'Nucleus Boxes',      false, 0, 0, 0, 0, null, 'BOXES',      'PER_HIVE', 'pieces', false,  4, NOW(), NOW()),

    -- HIVE_PARTS
    (gen_random_uuid(), user_id_param, 'BOTTOM_BOARD',     'Bottom Boards',     true,  1, 0, 0, 0, null, 'HIVE_PARTS', 'PER_HIVE', 'pieces', false,  5, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'INNER_COVER',      'Inner Covers',      true,  1, 0, 0, 0, null, 'HIVE_PARTS', 'PER_HIVE', 'pieces', false,  6, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'COVER',            'Outer Covers',      true,  1, 0, 0, 0, null, 'HIVE_PARTS', 'PER_HIVE', 'pieces', false,  7, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'QUEEN_EXCLUDER',   'Queen Excluders',   true,  1, 0, 0, 0, null, 'HIVE_PARTS', 'PER_HIVE', 'pieces', false,  8, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'HIVE_STAND',       'Hive Stands',       true,  1, 0, 0, 0, null, 'HIVE_PARTS', 'PER_HIVE', 'pieces', false,  9, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'ENTRANCE_REDUCER', 'Entrance Reducers', true,  1, 0, 0, 0, null, 'HIVE_PARTS', 'PER_HIVE', 'pieces', false, 10, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'MOUSE_GUARD',      'Mouse Guards',      false, 1, 0, 0, 0, null, 'HIVE_PARTS', 'PER_HIVE', 'pieces', false, 11, NOW(), NOW()),

    -- FRAMES
    (gen_random_uuid(), user_id_param, 'FRAMES', 'Frames', true, 0, 0, 0, 0, null, 'FRAMES', 'PER_HIVE', 'pieces', false, 12, NOW(), NOW()),

    -- FEEDING
    (gen_random_uuid(), user_id_param, 'FEEDER', 'Feeders', false, 0, 0, 0, 0, null, 'FEEDING', 'PER_HIVE', 'pieces', false, 13, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'SUGAR',  'Sugar',   true, 12, 0, 0, 0, null, 'FEEDING', 'PER_HIVE', 'kg',     false, 14, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'SYRUP',  'Syrup',   false, 0, 0, 0, 0, null, 'FEEDING', 'PER_HIVE', 'liters', false, 15, NOW(), NOW()),

    -- CONSUMABLES
    (gen_random_uuid(), user_id_param, 'WAX_FOUNDATION', 'Wax Foundation', false, 0, 0, 0, 0, null, 'CONSUMABLES', 'PER_HIVE', 'sheets', false, 16, NOW(), NOW()),

    -- TOOLS
    (gen_random_uuid(), user_id_param, 'HIVE_TOOL',   'Hive Tool',    true,  0, 0, 0, 0, null, 'TOOLS', 'SHARED', 'pieces', false, 17, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'SMOKER',      'Smoker',       true,  0, 0, 0, 0, null, 'TOOLS', 'SHARED', 'pieces', false, 18, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'MARKING_PEN', 'Marking Pen',  true,  0, 0, 0, 0, null, 'TOOLS', 'SHARED', 'pieces', false, 19, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'FRAME_GRIP',  'Frame Grip',   true,  0, 0, 0, 0, null, 'TOOLS', 'SHARED', 'pieces', false, 20, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'FRAME_PERCH', 'Frame Perch',  false, 0, 0, 0, 0, null, 'TOOLS', 'SHARED', 'pieces', false, 21, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'QUEEN_CAGE',  'Queen Cages',  false, 0, 0, 0, 0, null, 'TOOLS', 'SHARED', 'pieces', false, 22, NOW(), NOW()),

    -- PROTECTIVE
    (gen_random_uuid(), user_id_param, 'BEE_SUIT', 'Bee Suit or Jacket', true,  0, 0, 0, 0, null, 'PROTECTIVE', 'SHARED', 'pieces', false, 23, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'GLOVES',   'Gloves',             true,  0, 0, 0, 0, null, 'PROTECTIVE', 'SHARED', 'pieces', false, 24, NOW(), NOW()),

    -- EXTRACTION
    (gen_random_uuid(), user_id_param, 'EXTRACTOR',       'Extractor',       false, 0, 0, 0, 0, null, 'EXTRACTION', 'SHARED', 'pieces', false, 25, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'UNCAPPING_KNIFE', 'Uncapping Knife', false, 0, 0, 0, 0, null, 'EXTRACTION', 'SHARED', 'pieces', false, 26, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'UNCAPPING_TANK',  'Uncapping Tank',  false, 0, 0, 0, 0, null, 'EXTRACTION', 'SHARED', 'pieces', false, 27, NOW(), NOW())
  ON CONFLICT ("userId", "itemId") DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Backfill new items for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM "User" LOOP
        PERFORM create_default_equipment_items(user_record.id);
    END LOOP;
END $$;
