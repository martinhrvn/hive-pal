import type { WeatherCondition } from 'shared-schemas';

/**
 * Maps weather condition from API format to inspection form format
 */
export function mapWeatherConditionToForm(
  apiCondition: WeatherCondition,
): string {
  switch (apiCondition) {
    case 'CLEAR':
      return 'sunny';
    case 'PARTLY_CLOUDY':
      return 'partly-cloudy';
    case 'OVERCAST':
    case 'FOG':
      return 'cloudy';
    case 'DRIZZLE':
    case 'RAIN':
    case 'SNOW':
      return 'rainy';
    default:
      return 'partly-cloudy'; // fallback
  }
}
