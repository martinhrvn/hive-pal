-- CreateEnum
-- This migration seeds default equipment items for all users and creates a trigger for new users

-- Function to create default equipment items for a user
CREATE OR REPLACE FUNCTION create_default_equipment_items(user_id_param UUID)
RETURNS VOID AS $$
BEGIN
  -- Create default multiplier
  INSERT INTO "EquipmentMultiplier" (id, "userId", "targetMultiplier", "createdAt", "updatedAt")
  VALUES (gen_random_uuid(), user_id_param, 1.5, NOW(), NOW())
  ON CONFLICT ("userId") DO NOTHING;
  
  -- Create default equipment items
  INSERT INTO "EquipmentItem" (id, "userId", "itemId", name, enabled, "perHive", extra, "neededOverride", category, unit, "isCustom", "displayOrder", "createdAt", "updatedAt")
  VALUES 
    -- BOXES category
    (gen_random_uuid(), user_id_param, 'DEEP_BOX', 'Deep Boxes', true, 1, 0, null, 'BOXES', 'pieces', false, 1, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'SHALLOW_BOX', 'Shallow Boxes', true, 2, 0, null, 'BOXES', 'pieces', false, 2, NOW(), NOW()),
    
    -- HIVE_PARTS category  
    (gen_random_uuid(), user_id_param, 'BOTTOM_BOARD', 'Bottom Boards', true, 1, 0, null, 'HIVE_PARTS', 'pieces', false, 3, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'COVER', 'Covers', true, 1, 0, null, 'HIVE_PARTS', 'pieces', false, 4, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'QUEEN_EXCLUDER', 'Queen Excluders', true, 1, 0, null, 'HIVE_PARTS', 'pieces', false, 5, NOW(), NOW()),
    
    -- FRAMES category - Special calculation based on boxes
    (gen_random_uuid(), user_id_param, 'FRAMES', 'Frames', true, 0, 0, null, 'FRAMES', 'pieces', false, 6, NOW(), NOW()),
    
    -- FEEDING category
    (gen_random_uuid(), user_id_param, 'FEEDER', 'Feeders', false, 0, 0, null, 'FEEDING', 'pieces', false, 7, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'SUGAR', 'Sugar', true, 12, 0, null, 'FEEDING', 'kg', false, 8, NOW(), NOW()),
    (gen_random_uuid(), user_id_param, 'SYRUP', 'Syrup', false, 0, 0, null, 'FEEDING', 'liters', false, 9, NOW(), NOW())
  ON CONFLICT ("userId", "itemId") DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Seed default equipment items for all existing users
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM "User" LOOP
        PERFORM create_default_equipment_items(user_record.id::UUID);
    END LOOP;
END $$;

-- Create trigger function to automatically create default equipment for new users
CREATE OR REPLACE FUNCTION trigger_create_default_equipment()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM create_default_equipment_items(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after a new user is inserted
DROP TRIGGER IF EXISTS create_default_equipment_trigger ON "User";
CREATE TRIGGER create_default_equipment_trigger
    AFTER INSERT ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION trigger_create_default_equipment();