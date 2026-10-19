import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';

// Response shapes of the weather endpoints, mirrored from
// packages/shared-schemas/src/weather/weather.schema.ts.
type WeatherCondition =
  'CLEAR' | 'PARTLY_CLOUDY' | 'OVERCAST' | 'FOG' | 'DRIZZLE' | 'RAIN' | 'SNOW';

type Weather = {
  id: string;
  apiaryId: string;
  timestamp: string;
  fetchedAt: string;
  condition: WeatherCondition;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
};

type DailyForecast = {
  id: string;
  apiaryId: string;
  date: string;
  fetchedAt: string;
  condition: WeatherCondition;
  temperatureMin: number;
  temperatureMax: number;
  humidity: number;
  windSpeed: number;
};

/** The current temperature the mock reports, for assertions. */
export const MOCK_TEMPERATURE_C = 19;

const HOURLY: [WeatherCondition, number][] = [
  ['PARTLY_CLOUDY', 19],
  ['CLEAR', 20],
  ['CLEAR', 21],
  ['PARTLY_CLOUDY', 20],
  ['PARTLY_CLOUDY', 18],
];

const DAILY: [WeatherCondition, number, number][] = [
  ['PARTLY_CLOUDY', 9, 21],
  ['CLEAR', 10, 23],
  ['CLEAR', 11, 24],
  ['OVERCAST', 12, 20],
  ['DRIZZLE', 10, 16],
  ['RAIN', 9, 14],
  ['PARTLY_CLOUDY', 8, 17],
  ['CLEAR', 9, 19],
  ['CLEAR', 11, 22],
  ['PARTLY_CLOUDY', 12, 22],
];

/**
 * Serve a mild spring day for the apiary's weather card. Real weather is
 * fetched by the backend from OpenMeteo on a schedule (every 3 hours, the
 * forecast daily), so a freshly located apiary has none yet and the external
 * call would make the guide flaky. Other weather endpoints keep hitting the
 * third-party block.
 */
export async function mockWeather(page: Page, apiaryId: string) {
  const now = new Date();
  const fetchedAt = now.toISOString();
  const base = { apiaryId, fetchedAt };

  const current: Weather = {
    ...base,
    id: randomUUID(),
    timestamp: fetchedAt,
    condition: 'PARTLY_CLOUDY',
    temperature: MOCK_TEMPERATURE_C,
    feelsLike: MOCK_TEMPERATURE_C - 1,
    humidity: 55,
    windSpeed: 3.2,
  };

  const hourly: Weather[] = HOURLY.map(([condition, temperature], i) => ({
    ...base,
    id: randomUUID(),
    timestamp: new Date(now.getTime() + (i + 1) * 3_600_000).toISOString(),
    condition,
    temperature,
    feelsLike: temperature - 1,
    humidity: 50 + i * 2,
    windSpeed: 3 + i * 0.4,
  }));

  const daily: DailyForecast[] = DAILY.map(([condition, min, max], i) => {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() + i);
    date.setUTCHours(0, 0, 0, 0);
    return {
      ...base,
      id: randomUUID(),
      date: date.toISOString(),
      condition,
      temperatureMin: min,
      temperatureMax: max,
      humidity: 60,
      windSpeed: 3.5,
    };
  });

  const responses: Record<string, unknown> = {
    current,
    'hourly-forecast': hourly,
    'daily-forecast': daily,
  };
  await page.route(
    new RegExp(
      `/api/weather/(current|hourly-forecast|daily-forecast)/${apiaryId}(\\?.*)?$`,
    ),
    route => {
      const kind = new URL(route.request().url()).pathname.split('/')[3];
      return route.fulfill({ json: responses[kind] });
    },
  );
}

/**
 * Let the app read weather from the backend instead of the smoke suite's
 * block. These endpoints only read stored data, so an apiary without a
 * location shows the honest "No weather data available" state. Register
 * this first: routes added later (mockWeather) take priority.
 */
export async function allowStoredWeather(page: Page) {
  await page.route(/\/api\/weather\//, route => route.continue());
}
