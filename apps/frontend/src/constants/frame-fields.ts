/**
 * Frame field configuration constants
 *
 * Centralizes frame type definitions (eggs, brood, pollen, nectar, honey, empty)
 * with their properties: observation schema keys, display label i18n keys
 * (translate at render time with `t()`), and colors.
 *
 * Used across multiple components for consistency in frame display and charts.
 *
 * Note: The repeated object structure below is intentional declarative configuration.
 * This pattern provides type safety and readability over attempting to reduce duplication.
 */

export const FRAME_FIELDS = [
  {
    key: 'eggsFrames' as const,
    obsKey: 'eggsFrames' as const,
    labelKey: 'inspection:observations.eggsFrames',
    shortLabelKey: 'inspection:observations.frameShort.eggsFrames',
    color: 'var(--chart-7)',
    tailwindColor: 'bg-chart-7',
  },
  {
    key: 'uncappedBrood' as const,
    obsKey: 'uncappedBroodFrames' as const,
    labelKey: 'inspection:observations.uncappedBroodFrames',
    shortLabelKey: 'inspection:observations.frameShort.uncappedBroodFrames',
    color: 'var(--chart-4)',
    tailwindColor: 'bg-chart-4',
  },
  {
    key: 'cappedBrood' as const,
    obsKey: 'cappedBroodFrames' as const,
    labelKey: 'inspection:observations.cappedBroodFrames',
    shortLabelKey: 'inspection:observations.frameShort.cappedBroodFrames',
    color: 'var(--chart-6)',
    tailwindColor: 'bg-chart-6',
  },
  {
    key: 'droneBrood' as const,
    obsKey: 'droneBroodFrames' as const,
    labelKey: 'inspection:observations.droneBroodFrames',
    shortLabelKey: 'inspection:observations.frameShort.droneBroodFrames',
    color: 'var(--chart-8)',
    tailwindColor: 'bg-chart-8',
  },
  {
    key: 'pollen' as const,
    obsKey: 'pollenFrames' as const,
    labelKey: 'inspection:observations.pollenFrames',
    shortLabelKey: 'inspection:observations.frameShort.pollenFrames',
    color: 'var(--chart-3)',
    tailwindColor: 'bg-chart-3',
  },
  {
    key: 'nectar' as const,
    obsKey: 'nectarFrames' as const,
    labelKey: 'inspection:observations.nectarFrames',
    shortLabelKey: 'inspection:observations.frameShort.nectarFrames',
    color: 'var(--chart-5)',
    tailwindColor: 'bg-chart-5',
  },
  {
    key: 'honey' as const,
    obsKey: 'honeyFrames' as const,
    labelKey: 'inspection:observations.honeyFrames',
    shortLabelKey: 'inspection:observations.frameShort.honeyFrames',
    color: 'var(--chart-2)',
    tailwindColor: 'bg-chart-2',
  },
  {
    key: 'empty' as const,
    obsKey: 'emptyFrames' as const,
    labelKey: 'inspection:observations.emptyFrames',
    shortLabelKey: 'inspection:observations.frameShort.emptyFrames',
    color: 'var(--muted-foreground)',
    tailwindColor: 'bg-muted-foreground/40',
  },
] as const;

export type FrameFieldKey = (typeof FRAME_FIELDS)[number]['key'];
export type FrameObsKey = (typeof FRAME_FIELDS)[number]['obsKey'];

/**
 * Find a frame field configuration by its key
 */
export function getFrameField(key: FrameFieldKey) {
  return FRAME_FIELDS.find(f => f.key === key);
}

/**
 * Find a frame field configuration by its observation schema key
 */
export function getFrameFieldByObsKey(obsKey: FrameObsKey) {
  return FRAME_FIELDS.find(f => f.obsKey === obsKey);
}

/**
 * Get all frame observation keys for type-safe filtering
 */
export const FRAME_OBS_KEYS = FRAME_FIELDS.map(
  f => f.obsKey,
) as readonly FrameObsKey[];
