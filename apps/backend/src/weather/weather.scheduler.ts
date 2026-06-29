import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from './weather.service';

@Injectable()
export class WeatherScheduler {
  private readonly logger = new Logger(WeatherScheduler.name);

  constructor(private readonly weatherService: WeatherService) {}

  /**
   * Refresh hourly weather every 3 hours. The hourly endpoint returns a 6-hour
   * window, so a 3-hourly cadence keeps "current" weather acceptably fresh
   * while cutting OpenMeteo calls from 24/day to 8/day per apiary.
   */
  @Cron(CronExpression.EVERY_3_HOURS)
  async handleHourlyWeatherUpdate() {
    this.logger.log('Starting scheduled hourly weather update');

    try {
      await this.weatherService.updateAllApiariesWeather({
        hourly: true,
        daily: false,
      });
      this.logger.log('Scheduled hourly weather update completed successfully');
    } catch (error) {
      this.logger.error(
        'Failed to complete scheduled hourly weather update',
        error,
      );
    }
  }

  /**
   * Refresh the 10-day daily forecast once per day. It barely changes within a
   * day, so fetching it hourly was the bulk of the wasted OpenMeteo usage.
   */
  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async handleDailyForecastUpdate() {
    this.logger.log('Starting scheduled daily forecast update');

    try {
      await this.weatherService.updateAllApiariesWeather({
        hourly: false,
        daily: true,
      });
      this.logger.log('Scheduled daily forecast update completed successfully');
    } catch (error) {
      this.logger.error(
        'Failed to complete scheduled daily forecast update',
        error,
      );
    }
  }

  /**
   * Clean up old weather data once a day at 3 AM
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleWeatherCleanup() {
    this.logger.log('Starting weather data cleanup');

    try {
      await this.weatherService.cleanupOldWeatherData();
      this.logger.log('Weather data cleanup completed successfully');
    } catch (error) {
      this.logger.error('Failed to complete weather data cleanup', error);
    }
  }
}
