import type {
  EquipmentItemWithCalculations,
  UpdateEquipmentItem,
} from 'shared-schemas';

/** Round to 2 decimal places to avoid floating point display noise. */
export const round2 = (n: number) => Math.round(n * 100) / 100;

const FRACTIONAL_UNITS = new Set(['kg', 'g', 'liters', 'l', 'ml', 'oz', 'lb']);

/** Pieces-based units are always whole numbers; weight/volume can be fractional. */
export function quantityInput(unit: string): {
  step: string;
  parse: (value: string) => number;
} {
  const isFractional = FRACTIONAL_UNITS.has(unit.toLowerCase());
  return {
    step: isFractional ? '0.5' : '1',
    parse: value =>
      (isFractional ? Number.parseFloat(value) : Number.parseInt(value, 10)) ||
      0,
  };
}

/** Custom items have a name; built-ins fall back to their camelCase id. */
export function getDisplayName(
  item: Pick<EquipmentItemWithCalculations, 'name' | 'itemId'>,
) {
  return (
    item.name ||
    item.itemId.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())
  );
}

export function toEditData(
  item: EquipmentItemWithCalculations,
): UpdateEquipmentItem {
  return {
    name: item.name,
    scope: item.scope,
    perHive: item.perHive,
    extra: item.extra,
    inExtraction: item.inExtraction ?? 0,
    damaged: item.damaged ?? 0,
    neededOverride: item.neededOverride,
    unit: item.unit,
  };
}
