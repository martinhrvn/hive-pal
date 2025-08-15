import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WeatherCondition, Prisma } from '@prisma/client';
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

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private readonly prisma: PrismaService) {}

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
          forecast_days: 1,
          timezone: 'auto',
        },
      });

      return response.data as OpenMeteoResponse;
    } catch (error) {
      this.logger.error(
        `Failed to fetch hourly weather for ${latitude},${longitude}:`,
        error,
      );
      throw error;
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
          forecast_days: 5,
          timezone: 'auto',
        },
      });

      return response.data as OpenMeteoResponse;
    } catch (error) {
      this.logger.error(
        `Failed to fetch daily forecast for ${latitude},${longitude}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Save hourly weather data to database
   */
  async saveHourlyWeather(
    apiaryId: string,
    data: OpenMeteoResponse,
  ): Promise<void> {
    if (!data.hourly) {
      this.logger.warn(`No hourly data received for apiary ${apiaryId}`);
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

    // Get the current hour's data (first item in arrays)
    const currentIndex = 0;
    const timestamp = new Date(time[currentIndex]);

    const weatherData: Prisma.WeatherCreateInput = {
      apiary: { connect: { id: apiaryId } },
      timestamp,
      temperature: temperature_2m[currentIndex],
      feelsLike: apparent_temperature[currentIndex],
      humidity: Math.round(relative_humidity_2m[currentIndex]),
      windSpeed: wind_speed_10m[currentIndex],
      condition: this.mapWeatherCode(weather_code[currentIndex]),
    };

    try {
      await this.prisma.weather.upsert({
        where: {
          apiaryId_timestamp: {
            apiaryId,
            timestamp,
          },
        },
        update: weatherData,
        create: weatherData,
      });

      this.logger.log(
        `Saved hourly weather for apiary ${apiaryId} at ${timestamp.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to save hourly weather for apiary ${apiaryId}:`,
        error,
      );
      throw error;
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
   * Update weather for all apiaries with coordinates
   */
  async updateAllApiariesWeather(): Promise<void> {
    const apiaries = await this.prisma.apiary.findMany({
      where: {
        AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
      },
    });

    this.logger.log(`Updating weather for ${apiaries.length} apiaries`);

    for (const apiary of apiaries) {
      if (apiary.latitude === null || apiary.longitude === null) continue;

      try {
        // Fetch and save hourly weather
        const hourlyData = await this.fetchHourlyWeather(
          apiary.latitude,
          apiary.longitude,
        );
        await this.saveHourlyWeather(apiary.id, hourlyData);

        // Fetch and save daily forecast
        const dailyData = await this.fetchDailyForecast(
          apiary.latitude,
          apiary.longitude,
        );
        await this.saveDailyForecast(apiary.id, dailyData);

        // Add a small delay to avoid hitting API rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        this.logger.error(
          `Failed to update weather for apiary ${apiary.id}:`,
          error,
        );
      }
    }

    this.logger.log('Weather update completed for all apiaries');
  }

  /**
   * Get current weather for an apiary
   */
  async getCurrentWeather(apiaryId: string) {
    return this.prisma.weather.findFirst({
      where: { apiaryId },
      orderBy: { timestamp: 'desc' },
    });
  }

  /**
   * Get weather forecast for an apiary
   */
  async getForecast(apiaryId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.weatherForecast.findMany({
      where: {
        apiaryId,
        date: { gte: today },
      },
      orderBy: { date: 'asc' },
      take: 5,
    });
  }

  /**
   * Clean up old weather data (older than 30 days)
   */
  async cleanupOldWeatherData(): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const deleted = await this.prisma.weather.deleteMany({
      where: {
        timestamp: { lt: thirtyDaysAgo },
      },
    });

    this.logger.log(`Cleaned up ${deleted.count} old weather records`);
  }
}
