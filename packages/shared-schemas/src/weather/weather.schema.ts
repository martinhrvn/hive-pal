import { z } from 'zod';

export const WeatherConditionEnum = z.enum([
  'CLEAR',
  'PARTLY_CLOUDY',
  'OVERCAST',
  'FOG',
  'DRIZZLE',
  'RAIN',
  'SNOW',
]);

export type WeatherCondition = z.infer<typeof WeatherConditionEnum>;

export const WeatherSchema = z.object({
  id: z.uuid(),
  apiaryId: z.uuid(),
  timestamp: z.iso.datetime(),
  fetchedAt: z.iso.datetime(),
  condition: WeatherConditionEnum,
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.int().min(0).max(100),
  windSpeed: z.number().min(0),
});

export const WeatherHourlyForecastSchema = z.object({
  id: z.uuid(),
  apiaryId: z.uuid(),
  timestamp: z.iso.datetime(),
  fetchedAt: z.iso.datetime(),
  condition: WeatherConditionEnum,
  temperature: z.number(),
  feelsLike: z.number(),
  humidity: z.int().min(0).max(100),
  windSpeed: z.number().min(0),
});

export const WeatherForecastSchema = z.object({
  id: z.uuid(),
  apiaryId: z.uuid(),
  date: z.iso.datetime(),
  fetchedAt: z.iso.datetime(),
  condition: WeatherConditionEnum,
  temperatureMin: z.number(),
  temperatureMax: z.number(),
  humidity: z.int().min(0).max(100),
  windSpeed: z.number().min(0),
});

export type Weather = z.infer<typeof WeatherSchema>;
export type WeatherHourlyForecast = z.infer<typeof WeatherHourlyForecastSchema>;
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

// Response types for API usage
export type WeatherResponse = Weather;
export type WeatherHourlyForecastResponse = WeatherHourlyForecast;
export type WeatherForecastResponse = WeatherForecast;
