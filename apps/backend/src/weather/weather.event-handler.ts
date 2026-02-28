import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { UserLoginEvent } from '../events/auth.events';
import { WeatherService } from './weather.service';

@Injectable()
export class WeatherEventHandler {
  private readonly logger = new Logger(WeatherEventHandler.name);

  constructor(private readonly weatherService: WeatherService) {}

  @OnEvent('user.login')
  async handleUserLogin(event: UserLoginEvent) {
    const { userId, email, lastLoginAt } = event;

    // Trigger on-demand weather refresh if data is likely stale:
    // - User has never logged in before (lastLoginAt is null)
    // - User's last login was more than 1 hour ago
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isStale = !lastLoginAt || lastLoginAt < oneHourAgo;

    if (!isStale) {
      this.logger.debug(
        `Skipping weather refresh for user ${email} — data is fresh`,
      );
      return;
    }

    this.logger.log(
      `Triggering on-demand weather refresh for user ${email} (last login: ${lastLoginAt?.toISOString() ?? 'never'})`,
    );

    try {
      await this.weatherService.updateUserApiariesWeather(userId);
    } catch (error) {
      this.logger.error(`Failed to refresh weather for user ${email}:`, error);
    }
  }
}
