/**
 * Frame field configuration constants
 *
 * Centralizes frame type definitions (eggs, brood, pollen, nectar, honey, empty)
 * with their properties: observation schema keys, display labels, and colors.
 *
 * Used across multiple components for consistency in frame display and charts.
 */

// eslint-disable-next-line sonar/no-duplicate-string -- Intentional: declarative config with consistent structure for type safety and readability
export const FRAME_FIELDS = [
  {
    key: 'eggsFrames' as const,
    obsKey: 'eggsFrames' as const,
    label: 'Eggs',
    shortLabel: 'Eggs',
    color: '#facc15',
    tailwindColor: 'bg-yellow-400',
  },
  {
    key: 'uncappedBrood' as const,
    obsKey: 'uncappedBroodFrames' as const,
    label: 'Uncapped Brood',
    shortLabel: 'Uncapped',
    color: '#fb923c',
    tailwindColor: 'bg-orange-400',
  },
  {
    key: 'cappedBrood' as const,
    obsKey: 'cappedBroodFrames' as const,
    label: 'Capped Brood',
    shortLabel: 'Capped',
    color: '#b45309',
    tailwindColor: 'bg-amber-600',
  },
  {
    key: 'droneBrood' as const,
    obsKey: 'droneBroodFrames' as const,
    label: 'Drone Brood',
    shortLabel: 'Drone',
    color: '#92400e',
    tailwindColor: 'bg-amber-800',
  },
  {
    key: 'pollen' as const,
    obsKey: 'pollenFrames' as const,
    label: 'Pollen',
    shortLabel: 'Pollen',
    color: '#22c55e',
    tailwindColor: 'bg-green-500',
  },
  {
    key: 'nectar' as const,
    obsKey: 'nectarFrames' as const,
    label: 'Nectar',
    shortLabel: 'Nectar',
    color: '#f97316',
    tailwindColor: 'bg-orange-500',
  },
  {
    key: 'honey' as const,
    obsKey: 'honeyFrames' as const,
    label: 'Honey',
    shortLabel: 'Stores',
    color: '#eab308',
    tailwindColor: 'bg-yellow-500',
  },
  {
    key: 'empty' as const,
    obsKey: 'emptyFrames' as const,
    label: 'Empty / Foundation',
    shortLabel: 'Space',
    color: '#cbd5e1',
    tailwindColor: 'bg-slate-300',
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
