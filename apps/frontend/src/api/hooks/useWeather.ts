import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { WeatherResponse, WeatherHourlyForecastResponse, WeatherForecastResponse } from 'shared-schemas';
import type { UseQueryOptions } from '@tanstack/react-query';

// Query keys
const WEATHER_KEYS = {
  all: ['weather'] as const,
  current: () => [...WEATHER_KEYS.all, 'current'] as const,
  currentByApiary: (apiaryId: string) => [...WEATHER_KEYS.current(), apiaryId] as const,
  hourlyForecast: () => [...WEATHER_KEYS.all, 'hourly-forecast'] as const,
  hourlyForecastByApiary: (apiaryId: string) => [...WEATHER_KEYS.hourlyForecast(), apiaryId] as const,
  dailyForecast: () => [...WEATHER_KEYS.all, 'daily-forecast'] as const,
  dailyForecastByApiary: (apiaryId: string) => [...WEATHER_KEYS.dailyForecast(), apiaryId] as const,
  history: () => [...WEATHER_KEYS.all, 'history'] as const,
  historyByApiary: (apiaryId: string, params?: any) => [...WEATHER_KEYS.history(), apiaryId, params] as const,
};

// Get current weather for an apiary
export const useCurrentWeather = (
  apiaryId: string,
  queryOptions?: Partial<UseQueryOptions<WeatherResponse>>,
) => {
  return useQuery<WeatherResponse>({
    queryKey: WEATHER_KEYS.currentByApiary(apiaryId),
    queryFn: async () => {
      const response = await apiClient.get<WeatherResponse>(
        `/api/weather/current/${apiaryId}`,
      );
      return response.data;
    },
    enabled: !!apiaryId,
    ...queryOptions,
  });
};

// Get 5-hour hourly forecast for an apiary
export const useWeatherHourlyForecast = (
  apiaryId: string,
  queryOptions?: Partial<UseQueryOptions<WeatherHourlyForecastResponse[]>>,
) => {
  return useQuery<WeatherHourlyForecastResponse[]>({
    queryKey: WEATHER_KEYS.hourlyForecastByApiary(apiaryId),
    queryFn: async () => {
      const response = await apiClient.get<WeatherHourlyForecastResponse[]>(
        `/api/weather/hourly-forecast/${apiaryId}`,
      );
      return response.data;
    },
    enabled: !!apiaryId,
    ...queryOptions,
  });
};

// Get 7-day daily forecast for an apiary
export const useWeatherDailyForecast = (
  apiaryId: string,
  queryOptions?: Partial<UseQueryOptions<WeatherForecastResponse[]>>,
) => {
  return useQuery<WeatherForecastResponse[]>({
    queryKey: WEATHER_KEYS.dailyForecastByApiary(apiaryId),
    queryFn: async () => {
      const response = await apiClient.get<WeatherForecastResponse[]>(
        `/api/weather/daily-forecast/${apiaryId}`,
      );
      return response.data;
    },
    enabled: !!apiaryId,
    ...queryOptions,
  });
};

// Get weather history for an apiary
export const useWeatherHistory = (
  apiaryId: string,
  params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
  },
  queryOptions?: Partial<UseQueryOptions<WeatherResponse[]>>,
) => {
  return useQuery<WeatherResponse[]>({
    queryKey: WEATHER_KEYS.historyByApiary(apiaryId, params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate);
      if (params?.endDate) searchParams.append('endDate', params.endDate);
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const queryString = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const response = await apiClient.get<WeatherResponse[]>(
        `/api/weather/history/${apiaryId}${queryString}`,
      );
      return response.data;
    },
    enabled: !!apiaryId,
    ...queryOptions,
  });
};

// Legacy hook for backward compatibility
export const useWeatherForecast = (
  apiaryId: string,
  queryOptions?: Partial<UseQueryOptions<WeatherForecastResponse[]>>,
) => {
  return useWeatherDailyForecast(apiaryId, queryOptions);
};