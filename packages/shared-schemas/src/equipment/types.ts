export enum EquipmentCategory {
  BOXES = 'BOXES',
  HIVE_PARTS = 'HIVE_PARTS',
  FRAMES = 'FRAMES',
  FEEDING = 'FEEDING',
  CONSUMABLES = 'CONSUMABLES',
  TOOLS = 'TOOLS',
  PROTECTIVE = 'PROTECTIVE',
  EXTRACTION = 'EXTRACTION',
  CUSTOM = 'CUSTOM',
}

export enum EquipmentScope {
  PER_HIVE = 'PER_HIVE',
  SHARED = 'SHARED',
}

// Categories where equipment is shared regardless of hive count
export const SHARED_SCOPE_CATEGORIES = new Set([
  EquipmentCategory.TOOLS,
  EquipmentCategory.PROTECTIVE,
  EquipmentCategory.EXTRACTION,
]);

// Categories that support in-extraction status tracking (items that can be temporarily in the extractor)
export const EXTRACTION_TRACKING_CATEGORIES = new Set([
  EquipmentCategory.BOXES,
  EquipmentCategory.FRAMES,
]);

// Categories that support damaged status tracking
export const DAMAGE_TRACKING_CATEGORIES = new Set([
  EquipmentCategory.BOXES,
  EquipmentCategory.FRAMES,
  EquipmentCategory.HIVE_PARTS,
]);

