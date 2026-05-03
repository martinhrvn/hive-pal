/**
 * Box display utilities
 *
 * Provides centralized functions for calculating box display heights and generating
 * box type labels. Ensures consistent box rendering across all components.
 */

import { BoxVariantEnum } from 'shared-schemas';

/**
 * Display context for box height calculation
 * - 'hive-card': Compact hive card grid view
 * - 'minimap': Very compact minimap display (includes medium variant support)
 * - 'detail': Large detail/configurator view
 */
type BoxHeightContext = 'hive-card' | 'minimap' | 'detail';

/**
 * Maps BoxVariantEnum values to Tailwind height classes for consistent box rendering.
 *
 * Different contexts use different height scales:
 * - hive-card: Compact (h-8 to h-12)
 * - minimap: Very compact with medium support (h-8 to h-15)
 * - detail: Large (h-20 to h-28)
 *
 * @param variant - The box variant enum value
 * @param context - The display context determining height scale
 * @returns A Tailwind CSS height class string (e.g., 'h-12')
 *
 * @example
 * // Hive card view
 * const height = getBoxHeight(BoxVariantEnum.LANGSTROTH_DEEP, 'hive-card');
 * // Returns: 'h-12'
 *
 * // Minimap view
 * const height = getBoxHeight(BoxVariantEnum.LANGSTROTH_DEEP, 'minimap');
 * // Returns: 'h-15'
 *
 * // Detail view
 * const height = getBoxHeight(BoxVariantEnum.LANGSTROTH_DEEP, 'detail');
 * // Returns: 'h-28'
 */
export function getBoxHeight(
  variant?: BoxVariantEnum,
  context: BoxHeightContext = 'minimap',
): string {
  const deepVariants = [
    BoxVariantEnum.LANGSTROTH_DEEP,
    BoxVariantEnum.B_DEEP,
    BoxVariantEnum.NATIONAL_DEEP,
    BoxVariantEnum.DADANT,
  ];

  const mediumVariants = [BoxVariantEnum.LANGSTROTH_MEDIUM];

  const shallowVariants = [
    BoxVariantEnum.LANGSTROTH_SHALLOW,
    BoxVariantEnum.B_SHALLOW,
    BoxVariantEnum.NATIONAL_SHALLOW,
  ];

  // Hive card context: compact display in grid
  if (context === 'hive-card') {
    if (!variant) return 'h-8';
    if (deepVariants.includes(variant)) return 'h-12';
    if (shallowVariants.includes(variant)) return 'h-8';
    return 'h-10'; // Default for WARRE, TOP_BAR, CUSTOM
  }

  // Detail context: large display for box configurator
  if (context === 'detail') {
    if (!variant) return 'h-20';
    if (deepVariants.includes(variant)) return 'h-28';
    if (mediumVariants.includes(variant)) return 'h-24';
    if (shallowVariants.includes(variant)) return 'h-20';
    return 'h-24'; // Default for WARRE, TOP_BAR, CUSTOM
  }

  // Minimap context (default): very compact display with medium support
  if (!variant) return 'h-10';
  if (deepVariants.includes(variant)) return 'h-15';
  if (mediumVariants.includes(variant)) return 'h-12';
  if (shallowVariants.includes(variant)) return 'h-10';
  return 'h-8'; // Default for WARRE, TOP_BAR, CUSTOM
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
