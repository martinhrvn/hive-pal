import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrometheusService } from '../health/prometheus/prometheus.service';
import { WeatherCondition, Prisma } from '@/prisma/client';
import axios from 'axios';

interface OpenMeteoHourlyData {
  time: string[];
  temperature_2m: number[];
  apparent_temperature: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  weather_code: number[];
}

interface OpenMeteoDailyData {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  weather_code: number[];
  wind_speed_10m_max: number[];
  relative_humidity_2m_mean: number[];
}

interface OpenMeteoResponse {
  hourly?: OpenMeteoHourlyData;
  daily?: OpenMeteoDailyData;
}

const ACTIVE_USER_THRESHOLD_DAYS = 5;

// How often hourly weather is refreshed by the scheduler.
const HOURLY_FETCH_INTERVAL_HOURS = 3;

// Freshness windows for the per-apiary guards. Any fetch whose data is younger
// than these is skipped, so no trigger (cron or user.login) can stack redundant
// OpenMeteo calls. The hourly window is slightly under the cron interval so the
// scheduled run itself is never skipped.
const HOURLY_FRESH_MS = (HOURLY_FETCH_INTERVAL_HOURS - 0.5) * 60 * 60 * 1000;
const DAILY_FRESH_MS = 20 * 60 * 60 * 1000;

// Which forecast types a weather update should fetch.
interface WeatherUpdateOptions {
  hourly: boolean;
  daily: boolean;
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly prometheus: PrometheusService,
  ) {}

  /**
   * Map Open-Meteo weather codes to our simplified conditions
   * Based on: https://open-meteo.com/en/docs
   */
  private mapWeatherCode(code: number): WeatherCondition {
    if (code === 0) return WeatherCondition.CLEAR;
    if (code === 1 || code === 2) return WeatherCondition.PARTLY_CLOUDY;
    if (code === 3) return WeatherCondition.OVERCAST;
    if (code === 45 || code === 48) return WeatherCondition.FOG;
    if (code >= 51 && code <= 57) return WeatherCondition.DRIZZLE;
    if (code >= 61 && code <= 67) return WeatherCondition.RAIN;
    if (code >= 71 && code <= 77) return WeatherCondition.SNOW;
    if (code >= 80 && code <= 82) return WeatherCondition.RAIN; // Rain showers
    if (code >= 85 && code <= 86) return WeatherCondition.SNOW; // Snow showers
    if (code >= 95 && code <= 99) return WeatherCondition.RAIN; // Thunderstorm

    // Default to partly cloudy for unknown codes
    return WeatherCondition.PARTLY_CLOUDY;
  }

  /**
   * Fetch current and hourly weather data from Open-Meteo API
   * Now fetches next 6 hours for both current and forecast data
   */
  async fetchHourlyWeather(
    latitude: number,
    longitude: number,
  ): Promise<OpenMeteoResponse> {
    const url = 'https://api.open-meteo.com/v1/forecast';

    try {
      const response = await axios.get(url, {
        params: {
          latitude,
          longitude,
          hourly:
            'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
          forecast_hours: 6, // Get next 6 hours
          timezone: 'auto',
        },
      });

      this.prometheus.incrementWeatherFetches('hourly', 'success');
      void this.recordFetchLog('hourly', 'success');
      return response.data as OpenMeteoResponse;
    } catch (error) {
      this.prometheus.incrementWeatherFetches('hourly', 'error');
      void this.recordFetchLog('hourly', 'error');
      this.logger.error(
        `Failed to fetch hourly weather for ${latitude},${longitude}:`,
        error,
      );
      throw error;
    }
  }

  private async recordFetchLog(
    endpoint: 'hourly' | 'daily',
    outcome: 'success' | 'error',
  ): Promise<void> {
    try {
      await this.prisma.weatherFetchLog.create({
        data: { endpoint, outcome },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to record weather fetch log: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Fetch 5-day weather forecast from Open-Meteo API
   */
  async fetchDailyForecast(
    latitude: number,
    longitude: number,
  ): Promise<OpenMeteoResponse> {
    const url = 'https://api.open-meteo.com/v1/forecast';

    try {
      const response = await axios.get(url, {
        params: {
          latitude,
          longitude,
          daily:
            'temperature_2m_max,temperature_2m_min,weather_code,wind_speed_10m_max,relative_humidity_2m_mean',
          forecast_days: 10,
          timezone: 'auto',
        },
      });

      this.prometheus.incrementWeatherFetches('daily', 'success');
      void this.recordFetchLog('daily', 'success');
      return response.data as OpenMeteoResponse;
    } catch (error) {
      this.prometheus.incrementWeatherFetches('daily', 'error');
      void this.recordFetchLog('daily', 'error');
      this.logger.error(
        `Failed to fetch daily forecast for ${latitude},${longitude}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Save hourly weather data to database
   * Stores current hour as historical data and next 5 hours as forecast
   */
  async saveHourlyWeather(
    apiaryId: string,
    data: OpenMeteoResponse,
  ): Promise<void> {
    if (!data.hourly) {
      this.logger.warn(`No hourly data received for apiary ${apiaryId}`);
      return;
    }

    // Verify apiary exists before trying to save weather data
    const apiaryExists = await this.prisma.apiary.findUnique({
      where: { id: apiaryId },
      select: { id: true },
    });

    if (!apiaryExists) {
      this.logger.warn(`Apiary ${apiaryId} not found, skipping weather update`);
      return;
    }

    const {
      time,
      temperature_2m,
      apparent_temperature,
      relative_humidity_2m,
      wind_speed_10m,
      weather_code,
    } = data.hourly;

    // Save current hour as historical weather data
    const currentIndex = 0;
    const currentTimestamp = new Date(time[currentIndex]);

    const currentWeatherData: Prisma.WeatherCreateInput = {
      apiary: { connect: { id: apiaryId } },
      timestamp: currentTimestamp,
      fetchedAt: new Date(),
      temperature: temperature_2m[currentIndex],
      feelsLike: apparent_temperature[currentIndex],
      humidity: Math.round(relative_humidity_2m[currentIndex]),
      windSpeed: wind_speed_10m[currentIndex],
      condition: this.mapWeatherCode(weather_code[currentIndex]),
    };

    try {
      // Store current weather as historical data
      await this.prisma.weather.upsert({
        where: {
          apiaryId_timestamp: {
            apiaryId,
            timestamp: currentTimestamp,
          },
        },
        update: currentWeatherData,
        create: currentWeatherData,
      });

      this.logger.log(
        `Saved current weather for apiary ${apiaryId} at ${currentTimestamp.toISOString()}`,
      );

      // Clear old hourly forecasts for this apiary
      await this.prisma.weatherHourlyForecast.deleteMany({
        where: { apiaryId },
      });

      // Save next 5 hours as hourly forecast
      for (let i = 1; i <= 5 && i < time.length; i++) {
        const forecastTimestamp = new Date(time[i]);

        const hourlyForecastData: Prisma.WeatherHourlyForecastCreateInput = {
          apiary: { connect: { id: apiaryId } },
          timestamp: forecastTimestamp,
          temperature: temperature_2m[i],
          feelsLike: apparent_temperature[i],
          humidity: Math.round(relative_humidity_2m[i]),
          windSpeed: wind_speed_10m[i],
          condition: this.mapWeatherCode(weather_code[i]),
        };

        await this.prisma.weatherHourlyForecast.create({
          data: hourlyForecastData,
        });

        this.logger.log(
          `Saved hourly forecast for apiary ${apiaryId} at ${forecastTimestamp.toISOString()}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to save hourly weather for apiary ${apiaryId}:`,
        error,
      );
      // Don't re-throw - allow other apiaries to be processed
      // Errors are already caught and handled at the caller level
    }
  }

  /**
   * Save daily forecast data to database
   */
  async saveDailyForecast(
    apiaryId: string,
    data: OpenMeteoResponse,
  ): Promise<void> {
    if (!data.daily) {
      this.logger.warn(
        `No daily forecast data received for apiary ${apiaryId}`,
      );
      return;
    }

    // Verify apiary exists before trying to save weather data
    const apiaryExists = await this.prisma.apiary.findUnique({
      where: { id: apiaryId },
      select: { id: true },
    });

    if (!apiaryExists) {
      this.logger.warn(
        `Apiary ${apiaryId} not found, skipping daily forecast update`,
      );
      return;
    }

    const {
      time,
      temperature_2m_max,
      temperature_2m_min,
      weather_code,
      wind_speed_10m_max,
      relative_humidity_2m_mean,
    } = data.daily;

    for (let i = 0; i < time.length; i++) {
      const date = new Date(time[i]);
      date.setHours(0, 0, 0, 0); // Normalize to start of day

      const forecastData: Prisma.WeatherForecastCreateInput = {
        apiary: { connect: { id: apiaryId } },
        date,
        fetchedAt: new Date(),
        temperatureMax: temperature_2m_max[i],
        temperatureMin: temperature_2m_min[i],
        humidity: Math.round(relative_humidity_2m_mean[i]),
        windSpeed: wind_speed_10m_max[i],
        condition: this.mapWeatherCode(weather_code[i]),
      };

      try {
        await this.prisma.weatherForecast.upsert({
          where: {
            apiaryId_date: {
              apiaryId,
              date,
            },
          },
          update: forecastData,
          create: forecastData,
        });

        this.logger.log(
          `Saved forecast for apiary ${apiaryId} on ${date.toISOString()}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to save forecast for apiary ${apiaryId}:`,
          error,
        );
      }
    }
  }

  /**
   * Whether hourly weather for this apiary was fetched recently enough to skip.
   */
  private async isHourlyFresh(apiaryId: string): Promise<boolean> {
    const latest = await this.prisma.weather.findFirst({
      where: { apiaryId },
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    });

    return (
      !!latest && latest.fetchedAt.getTime() > Date.now() - HOURLY_FRESH_MS
    );
  }

  /**
   * Whether the daily forecast for this apiary was fetched recently enough to skip.
   */
  private async isDailyFresh(apiaryId: string): Promise<boolean> {
    const latest = await this.prisma.weatherForecast.findFirst({
      where: { apiaryId },
      orderBy: { fetchedAt: 'desc' },
      select: { fetchedAt: true },
    });

    return !!latest && latest.fetchedAt.getTime() > Date.now() - DAILY_FRESH_MS;
  }

  /**
   * Fetch and persist weather for a single apiary, honouring the requested
   * forecast types and per-type freshness guards. The guards keep OpenMeteo
   * usage bounded regardless of how often this is triggered (scheduler or
   * user.login). A throttle delay is only applied when an API call was made.
   */
  private async updateApiaryWeather(
    apiary: { id: string; latitude: number | null; longitude: number | null },
    options: WeatherUpdateOptions,
  ): Promise<void> {
    if (apiary.latitude === null || apiary.longitude === null) return;

    let fetched = false;

    try {
      if (options.hourly && !(await this.isHourlyFresh(apiary.id))) {
        const hourlyData = await this.fetchHourlyWeather(
          apiary.latitude,
          apiary.longitude,
        );
        await this.saveHourlyWeather(apiary.id, hourlyData);
        fetched = true;
      }

      if (options.daily && !(await this.isDailyFresh(apiary.id))) {
        const dailyData = await this.fetchDailyForecast(
          apiary.latitude,
          apiary.longitude,
        );
        await this.saveDailyForecast(apiary.id, dailyData);
        fetched = true;
      }

      // Small delay between live API calls to stay well under rate limits
      if (fetched) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      this.logger.error(
        `Failed to update weather for apiary ${apiary.id}:`,
        error,
      );
    }
  }

  /**
   * Update weather for all apiaries belonging to a specific user
   */
  async updateUserApiariesWeather(
    userId: string,
    options: WeatherUpdateOptions = { hourly: true, daily: true },
  ): Promise<void> {
    const apiaries = await this.prisma.apiary.findMany({
      where: {
        userId,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    this.logger.log(
      `Updating weather for ${apiaries.length} apiaries of user ${userId}`,
    );

    for (const apiary of apiaries) {
      await this.updateApiaryWeather(apiary, options);
    }
  }

  /**
   * Update weather for all apiaries with coordinates (only active users)
   */
  async updateAllApiariesWeather(
    options: WeatherUpdateOptions = { hourly: true, daily: true },
  ): Promise<void> {
    const activeThreshold = new Date();
    activeThreshold.setDate(
      activeThreshold.getDate() - ACTIVE_USER_THRESHOLD_DAYS,
    );

    const apiaries = await this.prisma.apiary.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        user: {
          lastLoginAt: { gte: activeThreshold },
        },
      },
    });

    this.logger.log(
      `Updating weather for ${apiaries.length} apiaries (active users within ${ACTIVE_USER_THRESHOLD_DAYS} days)`,
    );

    for (const apiary of apiaries) {
      await this.updateApiaryWeather(apiary, options);
    }

    this.logger.log('Weather update completed for all apiaries');
  }

  /**
   * Get current weather for an apiary (latest historical entry)
   */
  async getCurrentWeather(apiaryId: string) {
    return this.prisma.weather.findFirst({
      where: { apiaryId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get hourly forecast for an apiary (next 5 hours)
   */
  async getHourlyForecast(apiaryId: string) {
    const now = new Date();

    return this.prisma.weatherHourlyForecast.findMany({
      where: {
        apiaryId,
        timestamp: { gte: now },
      },
      orderBy: { timestamp: 'asc' },
      take: 5,
    });
  }

  /**
   * Get daily weather forecast for an apiary (next 7 days)
   */
  async getDailyForecast(apiaryId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.weatherForecast.findMany({
      where: {
        apiaryId,
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
      take: 7,
    });
  }

  /**
   * Get weather history for an apiary
   */
  async getWeatherHistory(
    apiaryId: string,
    startDate?: string,
    endDate?: string,
    limit: number = 24 * 7, // Default to last week (hourly)
  ) {
    const where: {
      apiaryId: string;
      timestamp?: {
        gte?: Date;
        lte?: Date;
      };
    } = { apiaryId };

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    return this.prisma.weather.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  /**
   * Get weather data for a specific date, preferring midday readings
   * Returns the best available weather record for the given date
   */
  async getWeatherForDate(apiaryId: string, date: string) {
    // Parse date and create date range for the entire day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all weather records for that date
    const weatherRecords = await this.prisma.weather.findMany({
      where: {
        apiaryId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    if (weatherRecords.length === 0) {
      return null;
    }

    // Select the best hour - prefer noon (12:00), fallback to closest hour
    const bestRecord = weatherRecords.reduce((best, current) => {
      const currentHour = new Date(current.timestamp).getHours();
      const bestHour = new Date(best.timestamp).getHours();

      const currentDistance = Math.abs(currentHour - 12);
      const bestDistance = Math.abs(bestHour - 12);

      // Prefer closer to noon
      if (currentDistance < bestDistance) return current;

      // If same distance from noon, prefer earlier time
      if (currentDistance === bestDistance && currentHour < bestHour)
        return current;

      return best;
    });

    return bestRecord;
  }

  /**
   * Clean up old weather data and forecasts
   */
  async cleanupOldWeatherData(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Clean up old historical weather data (keep 30 days)
    const deletedWeather = await this.prisma.weather.deleteMany({
      where: {
        timestamp: { lt: thirtyDaysAgo },
      },
    });

    // Clean up old daily forecasts (older than 1 day)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const deletedForecasts = await this.prisma.weatherForecast.deleteMany({
      where: {
        date: { lt: yesterday },
      },
    });

    // Clean up old hourly forecasts (older than current time)
    const now = new Date();
    const deletedHourly = await this.prisma.weatherHourlyForecast.deleteMany({
      where: {
        timestamp: { lt: now },
      },
    });

    this.logger.log(
      `Cleaned up ${deletedWeather.count} old weather records, ${deletedForecasts.count} old daily forecasts, and ${deletedHourly.count} old hourly forecasts`,
    );
  }
}
