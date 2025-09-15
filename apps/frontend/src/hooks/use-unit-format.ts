import { usePreferences } from '@/api/hooks/useUserPreferences';
import {
  formatWeight,
  formatTemperature,
  formatDistance,
  formatSpeed,
  formatVolume,
  getWeightUnit,
  getTemperatureUnit,
  getVolumeUnit,
  parseWeight,
  parseTemperature,
  parseVolume,
  type UnitPreference,
} from '@/utils/unit-conversion';

/**
 * Hook that provides unit formatting functions based on user preferences
 */
export function useUnitFormat() {
  const { preferences } = usePreferences();

  const unitPreference =
    (preferences.data?.units as UnitPreference) || 'metric';

  return {
    // Current user's unit preference
    unitPreference,

    // Formatting functions (from storage units to display)
    formatWeight: (weightKg: number) => formatWeight(weightKg, unitPreference),
    formatTemperature: (tempCelsius: number) =>
      formatTemperature(tempCelsius, unitPreference),
    formatDistance: (distanceKm: number) =>
      formatDistance(distanceKm, unitPreference),
    formatSpeed: (speedKmh: number) => formatSpeed(speedKmh, unitPreference),
    formatVolume: (volumeLiters: number) =>
      formatVolume(volumeLiters, unitPreference),

    // Get unit labels
    getWeightUnit: () => getWeightUnit(unitPreference),
    getTemperatureUnit: () => getTemperatureUnit(unitPreference),
    getVolumeUnit: () => getVolumeUnit(unitPreference),

    // Parsing functions (from user input to storage units)
    parseWeight: (value: number) => parseWeight(value, unitPreference),
    parseTemperature: (value: number) =>
      parseTemperature(value, unitPreference),
    parseVolume: (value: number, unit: string) =>
      parseVolume(value, unit, unitPreference),

    // Helper to check if metric or imperial
    isMetric: unitPreference === 'metric',
    isImperial: unitPreference === 'imperial',
  };
}
