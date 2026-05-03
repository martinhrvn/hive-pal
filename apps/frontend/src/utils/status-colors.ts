/**
 * Status color utility
 *
 * Provides consistent color mappings for various Status enum values across all UI components.
 * Ensures consistent visual representation of status across the application.
 */

import { HiveStatus, HarvestStatus } from 'shared-schemas';

/**
 * Maps HiveStatus enum values to Tailwind CSS class strings for consistent coloring
 * across all components that display hive status.
 *
 * @param status - The HiveStatus value to map to a color
 * @returns A Tailwind CSS class string (e.g., 'bg-green-500')
 *
 * @example
 * const colorClass = getStatusColor(HiveStatus.ACTIVE);
 * // Returns: 'bg-green-500'
 *
 * const element = <div className={getStatusColor(hive.status)} />;
 */
export function getStatusColor(
  status: HiveStatus | HarvestStatus | string | undefined,
): string {
  if (!status) return 'bg-gray-500';

  // HiveStatus colors
  if (status === HiveStatus.ACTIVE) return 'bg-green-500';
  if (status === HiveStatus.INACTIVE) return 'bg-yellow-500';
  if (status === HiveStatus.DEAD) return 'bg-red-500';

  // HarvestStatus colors
  if (status === HarvestStatus.DRAFT) return 'bg-gray-500';
  if (status === HarvestStatus.IN_PROGRESS) return 'bg-yellow-500';
  if (status === HarvestStatus.COMPLETED) return 'bg-green-500';

  // String-based fallbacks for status values passed as strings
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500';
    case 'INACTIVE':
      return 'bg-yellow-500';
    case 'DEAD':
      return 'bg-red-500';
    case 'DRAFT':
      return 'bg-gray-500';
    case 'IN_PROGRESS':
      return 'bg-yellow-500';
    case 'COMPLETED':
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
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
