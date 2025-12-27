export type UnitPreference = 'metric' | 'imperial';

export interface WeightUnit {
  value: number;
  unit: string;
  label: string;
}

export interface TemperatureUnit {
  value: number;
  unit: string;
  label: string;
}

export interface DistanceUnit {
  value: number;
  unit: string;
  label: string;
}

export interface VolumeUnit {
  value: number;
  unit: string;
  label: string;
}

/**
 * Convert weight from kg to user's preferred unit
 * @param weightKg - Weight in kilograms
 * @param preference - User's unit preference
 * @returns Formatted weight with unit
 */
export function formatWeight(
  weightKg: number,
  preference: UnitPreference = 'metric',
): WeightUnit {
  if (preference === 'imperial') {
    const pounds = weightKg * 2.20462;
    return {
      value: Math.round(pounds * 100) / 100,
      unit: 'lb',
      label: `${Math.round(pounds * 100) / 100} lb`,
    };
  }

  return {
    value: Math.round(weightKg * 100) / 100,
    unit: 'kg',
    label: `${Math.round(weightKg * 100) / 100} kg`,
  };
}

/**
 * Convert temperature from Celsius to user's preferred unit
 * @param tempCelsius - Temperature in Celsius
 * @param preference - User's unit preference
 * @returns Formatted temperature with unit
 */
export function formatTemperature(
  tempCelsius: number,
  preference: UnitPreference = 'metric',
): TemperatureUnit {
  if (preference === 'imperial') {
    const fahrenheit = (tempCelsius * 9) / 5 + 32;
    return {
      value: Math.round(fahrenheit * 10) / 10,
      unit: '°F',
      label: `${Math.round(fahrenheit * 10) / 10}°F`,
    };
  }

  return {
    value: Math.round(tempCelsius * 10) / 10,
    unit: '°C',
    label: `${Math.round(tempCelsius * 10) / 10}°C`,
  };
}

/**
 * Convert distance/speed from km to user's preferred unit
 * @param distanceKm - Distance in kilometers
 * @param preference - User's unit preference
 * @returns Formatted distance with unit
 */
export function formatDistance(
  distanceKm: number,
  preference: UnitPreference = 'metric',
): DistanceUnit {
  if (preference === 'imperial') {
    const miles = distanceKm * 0.621371;
    return {
      value: Math.round(miles * 100) / 100,
      unit: 'mi',
      label: `${Math.round(miles * 100) / 100} mi`,
    };
  }

  return {
    value: Math.round(distanceKm * 100) / 100,
    unit: 'km',
    label: `${Math.round(distanceKm * 100) / 100} km`,
  };
}

/**
 * Convert speed from km/h to user's preferred unit
 * @param speedKmh - Speed in km/h
 * @param preference - User's unit preference
 * @returns Formatted speed with unit
 */
export function formatSpeed(
  speedKmh: number,
  preference: UnitPreference = 'metric',
): DistanceUnit {
  if (preference === 'imperial') {
    const mph = speedKmh * 0.621371;
    return {
      value: Math.round(mph * 10) / 10,
      unit: 'mph',
      label: `${Math.round(mph * 10) / 10} mph`,
    };
  }

  return {
    value: Math.round(speedKmh * 10) / 10,
    unit: 'km/h',
    label: `${Math.round(speedKmh * 10) / 10} km/h`,
  };
}

/**
 * Convert volume from liters to user's preferred unit
 * @param volumeLiters - Volume in liters
 * @param preference - User's unit preference
 * @returns Formatted volume with unit
 */
export function formatVolume(
  volumeLiters: number,
  preference: UnitPreference = 'metric',
): VolumeUnit {
  if (preference === 'imperial') {
    // Convert to fluid ounces first for smaller volumes
    const fluidOunces = volumeLiters * 33.814;
    
    if (fluidOunces < 32) {
      // Show in fluid ounces for very small volumes
      return {
        value: Math.round(fluidOunces * 10) / 10,
        unit: 'fl oz',
        label: `${Math.round(fluidOunces * 10) / 10} fl oz`,
      };
    } else if (fluidOunces < 128) {
      // Show in quarts for medium volumes (32-127 fl oz)
      const quarts = volumeLiters * 1.05669;
      return {
        value: Math.round(quarts * 100) / 100,
        unit: 'qt',
        label: `${Math.round(quarts * 100) / 100} qt`,
      };
    } else {
      // Show in gallons for larger volumes (≥128 fl oz)
      const gallons = volumeLiters * 0.264172;
      return {
        value: Math.round(gallons * 100) / 100,
        unit: 'gal',
        label: `${Math.round(gallons * 100) / 100} gal`,
      };
    }
  }

  // Metric: show in ml for small volumes, L for larger
  if (volumeLiters < 1) {
    const milliliters = volumeLiters * 1000;
    return {
      value: Math.round(milliliters),
      unit: 'ml',
      label: `${Math.round(milliliters)} ml`,
    };
  }

  return {
    value: Math.round(volumeLiters * 100) / 100,
    unit: 'L',
    label: `${Math.round(volumeLiters * 100) / 100} L`,
  };
}

/**
 * Get the appropriate weight unit label for user preference
 * @param preference - User's unit preference
 * @returns Weight unit label
 */
export function getWeightUnit(preference: UnitPreference = 'metric'): string {
  return preference === 'imperial' ? 'lb' : 'kg';
}

/**
 * Get the appropriate temperature unit label for user preference
 * @param preference - User's unit preference
 * @returns Temperature unit label
 */
export function getTemperatureUnit(
  preference: UnitPreference = 'metric',
): string {
  return preference === 'imperial' ? '°F' : '°C';
}

/**
 * Get the appropriate volume unit label for user preference
 * @param preference - User's unit preference
 * @returns Volume unit label
 */
export function getVolumeUnit(preference: UnitPreference = 'metric'): string {
  return preference === 'imperial' ? 'gal' : 'L';
}

/**
 * Get the appropriate volume unit for a specific volume amount
 * @param volumeLiters - Volume in liters
 * @param preference - User's unit preference
 * @returns Volume unit string
 */
export function getVolumeUnitForAmount(
  volumeLiters: number,
  preference: UnitPreference = 'metric',
): string {
  if (preference === 'imperial') {
    const fluidOunces = volumeLiters * 33.814;
    if (fluidOunces < 32) return 'fl oz';
    if (fluidOunces < 128) return 'qt';
    return 'gal';
  }
  
  return volumeLiters < 1 ? 'ml' : 'L';
}

/**
 * Convert user input weight to kilograms (for storage)
 * @param value - Weight value in user's preferred unit
 * @param preference - User's unit preference
 * @returns Weight in kilograms
 */
export function parseWeight(
  value: number,
  preference: UnitPreference = 'metric',
): number {
  if (preference === 'imperial') {
    return value / 2.20462; // Convert pounds to kg
  }
  return value; // Already in kg
}

/**
 * Convert user input temperature to Celsius (for storage)
 * @param value - Temperature value in user's preferred unit
 * @param preference - User's unit preference
 * @returns Temperature in Celsius
 */
export function parseTemperature(
  value: number,
  preference: UnitPreference = 'metric',
): number {
  if (preference === 'imperial') {
    return ((value - 32) * 5) / 9; // Convert Fahrenheit to Celsius
  }
  return value; // Already in Celsius
}

/**
 * Convert user input volume to liters (for storage)
 * @param value - Volume value in user's preferred unit
 * @param unit - The unit the user entered ('gal', 'qt', 'L')
 * @param preference - User's unit preference
 * @returns Volume in liters
 */
export function parseVolume(
  value: number,
  unit: string,
  preference: UnitPreference = 'metric',
): number {
  if (preference === 'imperial') {
    if (unit === 'gal') {
      return value / 0.264172; // Convert gallons to liters
    } else if (unit === 'qt') {
      return value / 1.05669; // Convert quarts to liters
    } else if (unit === 'fl oz') {
      return value / 33.814; // Convert fluid ounces to liters
    }
  }
  if (unit === 'ml') {
    return value / 1000; // Convert milliliters to liters
  }
  return value; // Already in liters
}

/**
 * Convert a volume value from one unit to another
 * @param value - The volume value
 * @param fromUnit - The current unit
 * @param toUnit - The target unit
 * @returns Converted volume value
 */
export function convertVolumeUnit(
  value: number,
  fromUnit: string,
  toUnit: string,
): number {
  // First convert to liters as the base unit
  let liters = value;

  switch (fromUnit.toLowerCase()) {
    case 'ml':
      liters = value / 1000;
      break;
    case 'l':
      liters = value;
      break;
    case 'fl oz':
      liters = value / 33.814;
      break;
    case 'qt':
      liters = value / 1.05669;
      break;
    case 'gal':
      liters = value / 0.264172;
      break;
  }

  // Then convert from liters to target unit
  switch (toUnit.toLowerCase()) {
    case 'ml':
      return liters * 1000;
    case 'l':
      return liters;
    case 'fl oz':
      return liters * 33.814;
    case 'qt':
      return liters * 1.05669;
    case 'gal':
      return liters * 0.264172;
    default:
      return liters;
  }
}

export interface MassUnit {
  value: number;
  unit: string;
  label: string;
}

/**
 * Convert mass from grams to user's preferred unit (for small quantities like treatments)
 * @param massGrams - Mass in grams
 * @param preference - User's unit preference
 * @returns Formatted mass with unit
 */
export function formatMass(
  massGrams: number,
  preference: UnitPreference = 'metric',
): MassUnit {
  if (preference === 'imperial') {
    const ounces = massGrams * 0.035274;
    return {
      value: Math.round(ounces * 10) / 10,
      unit: 'oz',
      label: `${Math.round(ounces * 10) / 10} oz`,
    };
  }

  return {
    value: Math.round(massGrams * 10) / 10,
    unit: 'g',
    label: `${Math.round(massGrams * 10) / 10} g`,
  };
}

/**
 * Convert user input mass to grams (for storage)
 * @param value - Mass value in user's preferred unit
 * @param unit - The unit the user entered ('g' or 'oz')
 * @param preference - User's unit preference
 * @returns Mass in grams
 */
export function parseMass(
  value: number,
  unit: string,
  preference: UnitPreference = 'metric',
): number {
  if (preference === 'imperial' && unit === 'oz') {
    return value / 0.035274; // Convert oz to grams
  }
  return value; // Already in grams
}

/**
 * Get the appropriate mass unit label for user preference
 * @param preference - User's unit preference
 * @returns Mass unit label (g or oz)
 */
export function getMassUnit(preference: UnitPreference = 'metric'): string {
  return preference === 'imperial' ? 'oz' : 'g';
}

/**
 * Format treatment quantity based on unit type
 * Handles ml (volume), g (mass), and pcs (count - no conversion)
 * @param quantity - The quantity value
 * @param unit - The storage unit ('ml', 'g', or 'pcs')
 * @param preference - User's unit preference
 * @returns Formatted quantity with unit
 */
export function formatTreatmentQuantity(
  quantity: number,
  unit: string,
  preference: UnitPreference = 'metric',
): { value: number; unit: string; label: string } {
  if (unit === 'pcs') {
    // Pieces don't convert - universal unit
    return {
      value: quantity,
      unit: 'pcs',
      label: `${quantity} pcs`,
    };
  }

  if (unit === 'ml') {
    // Convert ml to user's preferred volume unit
    const volumeInLiters = quantity / 1000;
    return formatVolume(volumeInLiters, preference);
  }

  if (unit === 'g') {
    // Convert grams to user's preferred mass unit
    return formatMass(quantity, preference);
  }

  // Fallback for unknown units
  return {
    value: quantity,
    unit,
    label: `${quantity} ${unit}`,
  };
}

/**
 * Get the display unit for treatment based on storage unit and user preference
 * @param storageUnit - The unit used for storage ('ml', 'g', or 'pcs')
 * @param preference - User's unit preference
 * @returns Display unit string
 */
export function getTreatmentDisplayUnit(
  storageUnit: string,
  preference: UnitPreference = 'metric',
): string {
  if (storageUnit === 'pcs') {
    return 'pcs';
  }
  if (storageUnit === 'ml') {
    return preference === 'imperial' ? 'fl oz' : 'ml';
  }
  if (storageUnit === 'g') {
    return preference === 'imperial' ? 'oz' : 'g';
  }
  return storageUnit;
}
