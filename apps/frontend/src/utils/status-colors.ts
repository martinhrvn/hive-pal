/**
 * Status color utility
 *
 * Single source of truth for how HiveStatus / HarvestStatus values are
 * colored. Everything maps to a semantic tone first, and the tone maps to
 * theme tokens (see `--success`, `--warning`, … in index.css), so light and
 * dark mode stay consistent everywhere a status is shown.
 */

import { HiveStatus, HarvestStatus } from 'shared-schemas';
import type { StatusTone } from '@/components/common/status-pill';

const STATUS_TONE: Record<string, StatusTone> = {
  [HiveStatus.ACTIVE]: 'success',
  [HiveStatus.INACTIVE]: 'warning',
  [HiveStatus.DEAD]: 'danger',
  [HarvestStatus.COMPLETED]: 'success',
  [HarvestStatus.IN_PROGRESS]: 'warning',
};

/** Semantic tone for a status; anything unmapped is `neutral`. */
export function getStatusTone(
  status: HiveStatus | HarvestStatus | string | undefined,
): StatusTone {
  return (status && STATUS_TONE[status]) || 'neutral';
}

/** Solid background class per tone, for status dots and filled badges. */
export const STATUS_DOT_CLASS: Record<StatusTone, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-destructive',
  info: 'bg-info',
  neutral: 'bg-muted-foreground/60',
};

/** Readable text class per tone. */
export const STATUS_TEXT_CLASS: Record<StatusTone, string> = {
  success: 'text-success-foreground',
  warning: 'text-warning-foreground',
  danger: 'text-destructive-foreground',
  info: 'text-info-foreground',
  neutral: 'text-muted-foreground',
};

/**
 * i18n key (in the `hive` namespace) for a hive status label,
 * e.g. `ACTIVE` → `status.active`.
 */
export const hiveStatusLabelKey = (status: string) =>
  `status.${status.toLowerCase()}`;

/**
 * Solid background class for a status, e.g. `bg-success`.
 *
 * @example
 * <div className={getStatusColor(hive.status)} />
 */
export function getStatusColor(
  status: HiveStatus | HarvestStatus | string | undefined,
): string {
  return STATUS_DOT_CLASS[getStatusTone(status)];
}

/**
 * Maps status enums to hex color values for use in charts and visualizations
 * where Tailwind classes are not applicable.
 *
 * @param status - The status value (HiveStatus or HarvestStatus)
 * @returns A hex color string (e.g., '#22c55e')
 */
export function getStatusColorHex(
  status: HiveStatus | HarvestStatus | string | undefined,
): string {
  if (!status) return '#999999';

  switch (status) {
    case HiveStatus.ACTIVE:
    case HarvestStatus.COMPLETED:
    case 'ACTIVE':
    case 'COMPLETED':
      return '#22c55e'; // green-500
    case HiveStatus.INACTIVE:
    case HarvestStatus.IN_PROGRESS:
    case 'INACTIVE':
    case 'IN_PROGRESS':
      return '#eab308'; // yellow-500
    case HiveStatus.DEAD:
    case 'DEAD':
      return '#ef4444'; // red-500
    case HarvestStatus.DRAFT:
    case 'DRAFT':
      return '#999999'; // gray-500
    default:
      return '#999999';
  }
}
