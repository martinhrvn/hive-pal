/**
 * Box display utilities
 *
 * Provides centralized functions for calculating box display heights and generating
 * box type labels. Ensures consistent box rendering across all components.
 */

import { BoxVariantEnum, BoxTypeEnum } from 'shared-schemas';

/**
 * Display context for box height calculation
 * - 'hive-card': Compact hive card grid view
 * - 'minimap': Very compact minimap display
 * - 'detail': Large detail/configurator view
 */
type BoxHeightContext = 'hive-card' | 'minimap' | 'detail';

/**
 * Approximate real-world external box (Zarge) heights in millimetres, keyed by
 * variant. Boxes are rendered proportionally to these values so the stack
 * matches reality (e.g. a shallow super is drawn clearly shorter than a deep).
 *
 * Sources: common commercial dimensions (Langstroth deep 9⅝"/medium 6⅝"/
 * shallow 5¹¹⁄₁₆", Dadant brood ~300 mm, National deep/shallow).
 */
const VARIANT_HEIGHT_MM: Record<BoxVariantEnum, number> = {
  [BoxVariantEnum.LANGSTROTH_DEEP]: 240,
  [BoxVariantEnum.LANGSTROTH_MEDIUM]: 170,
  [BoxVariantEnum.LANGSTROTH_SHALLOW]: 145,
  [BoxVariantEnum.B_DEEP]: 225,
  [BoxVariantEnum.B_SHALLOW]: 150,
  [BoxVariantEnum.NATIONAL_DEEP]: 225,
  [BoxVariantEnum.NATIONAL_SHALLOW]: 150,
  [BoxVariantEnum.DADANT]: 300,
  [BoxVariantEnum.WARRE]: 210,
  [BoxVariantEnum.TOP_BAR]: 300,
  [BoxVariantEnum.CUSTOM]: 240,
};

/**
 * Real-world box heights in millimetres by box type. Used for hive systems
 * whose single variant does not encode physical size — most importantly
 * Dadant, where the same `DADANT` variant covers a full-height brood box, a
 * ~half-height honey super and a ~third-height feeder — and as a fallback when
 * a box has no variant set.
 */
const TYPE_HEIGHT_MM: Record<string, number> = {
  [BoxTypeEnum.BROOD]: 300,
  [BoxTypeEnum.HONEY]: 150,
  [BoxTypeEnum.FEEDER]: 100,
};

/**
 * Variants that map to a single physical box size in their enum value, so the
 * box *type* must decide the rendered height instead of the variant. Dadant is
 * the key case: brood/honey/feeder all share the `DADANT` variant but differ a
 * lot in real height.
 */
const TYPE_DRIVEN_VARIANTS: BoxVariantEnum[] = [BoxVariantEnum.DADANT];

/**
 * Per-context rendering: `scale` converts millimetres to pixels (anchored so a
 * ~300 mm brood box roughly matches the previous largest size in each context),
 * `min` guarantees a legible minimum so tiny boxes still render a usable bar.
 */
const CONTEXT_RENDER: Record<BoxHeightContext, { scale: number; min: number }> =
  {
    detail: { scale: 112 / 300, min: 34 },
    'hive-card': { scale: 48 / 300, min: 16 },
    minimap: { scale: 40 / 300, min: 13 },
  };

/**
 * Resolve the approximate real-world height (mm) of a box from its variant and
 * type. Type-driven variants (Dadant) and variant-less boxes are resolved by
 * type; everything else uses the variant's physical height.
 */
function resolveHeightMm(variant?: BoxVariantEnum, type?: string): number {
  if (
    variant &&
    TYPE_DRIVEN_VARIANTS.includes(variant) &&
    type &&
    TYPE_HEIGHT_MM[type] != null
  ) {
    return TYPE_HEIGHT_MM[type];
  }
  if (variant && VARIANT_HEIGHT_MM[variant] != null) {
    return VARIANT_HEIGHT_MM[variant];
  }
  if (type && TYPE_HEIGHT_MM[type] != null) {
    return TYPE_HEIGHT_MM[type];
  }
  return VARIANT_HEIGHT_MM[BoxVariantEnum.LANGSTROTH_DEEP];
}

/**
 * Calculate the rendered box height in **pixels**, proportional to the box's
 * real-world height, for a given display context. Because Dadant honey/feeder
 * boxes share one variant, the box `type` is needed to draw them at the correct
 * (shorter) height.
 *
 * @param variant - The box variant enum value
 * @param context - The display context determining the pixel scale
 * @param type - The box type (BROOD/HONEY/FEEDER); required for correct Dadant
 *   heights and used as a fallback when no variant is set
 * @returns Height in pixels (number)
 *
 * @example
 * getBoxHeight(BoxVariantEnum.DADANT, 'detail', BoxTypeEnum.BROOD); // 112
 * getBoxHeight(BoxVariantEnum.DADANT, 'detail', BoxTypeEnum.HONEY); //  56
 * getBoxHeight(BoxVariantEnum.DADANT, 'detail', BoxTypeEnum.FEEDER); // 37
 */
/**
 * Real-world box height in millimetres for a given variant/type — the same
 * table that drives the rendered stack, exposed for other proportional
 * visualizations (e.g. the hive header gradient).
 */
export function getBoxHeightMm(
  variant?: BoxVariantEnum,
  type?: string,
): number {
  return resolveHeightMm(variant, type);
}

export function getBoxHeight(
  variant?: BoxVariantEnum,
  context: BoxHeightContext = 'minimap',
  type?: string,
): number {
  const mm = resolveHeightMm(variant, type);
  const { scale, min } = CONTEXT_RENDER[context];
  return Math.round(Math.max(min, mm * scale));
}

/**
 * Maps box type strings to human-readable labels for display.
 *
 * Different contexts use different label formats:
 * - 'short': Single letter (B, H, F) - used in minimap/compact views
 * - 'long': Full name (Brood, Honey, Feeder) - used in detail views
 *
 * @param type - The box type string (e.g., 'BROOD', 'HONEY', 'FEEDER')
 * @param format - The label format ('short' | 'long')
 * @returns The formatted label string
 *
 * @example
 * getBoxTypeLabel('BROOD', 'short');  // Returns: 'B'
 * getBoxTypeLabel('BROOD', 'long');   // Returns: 'Brood'
 */
export function getBoxTypeLabel(
  type: string,
  format: 'short' | 'long' = 'short',
): string {
  if (format === 'long') {
    const longLabels: Record<string, string> = {
      BROOD: 'Brood',
      HONEY: 'Honey',
      FEEDER: 'Feeder',
    };
    return longLabels[type] || type;
  }

  // Default 'short' format
  const shortLabels: Record<string, string> = {
    BROOD: 'B',
    HONEY: 'H',
    FEEDER: 'F',
  };
  return shortLabels[type] || type.charAt(0);
}
