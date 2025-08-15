import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from './weather.service';

@Injectable()
export class WeatherScheduler {
  private readonly logger = new Logger(WeatherScheduler.name);

  constructor(private readonly weatherService: WeatherService) {}

  /**
   * Run every hour to fetch latest weather data
   */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleWeatherUpdate() {
    this.logger.log('Starting scheduled weather update');

    try {
      await this.weatherService.updateAllApiariesWeather();
      this.logger.log('Scheduled weather update completed successfully');
    } catch (error) {
      this.logger.error('Failed to complete scheduled weather update', error);
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
