import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HiveScaleService } from './hivescale.service';
import { MailService } from '../mail/mail.service';
import { UserPreferences } from 'shared-schemas';

// Cooldown between repeated alerts for the same device (6 hours in ms)
const ALERT_COOLDOWN_MS = 6 * 60 * 60 * 1000;

interface HiveScaleMeasurement {
  recorded_at: string;
  scale_1_weight_kg: number | null;
  scale_2_weight_kg: number | null;
  [key: string]: unknown;
}

interface HiveScaleDevice {
  id: string;
  display_name: string | null;
  scale_1_display_name: string | null;
  scale_2_display_name: string | null;
  [key: string]: unknown;
}

@Injectable()
export class SwarmAlertService {
  private readonly logger = new Logger(SwarmAlertService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly hiveScaleService: HiveScaleService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Main entry point called by the scheduler.
   * Iterates over all users that have swarm alerts enabled and checks their devices.
   */
  async checkAllUsers(): Promise<void> {
    this.logger.log('Starting swarm alert check for all users');

    // Fetch every user that has preferences stored
    // We use the raw prisma call through usersService to avoid a large abstraction.
    // getUsersWithSwarmAlertsEnabled is a convenience method we delegate to usersService.
    let users: Array<{ id: string; email: string; name: string | null }>;
    try {
      users = await this.usersService.getAllUsers();
    } catch (error) {
      this.logger.error('Failed to fetch users for swarm alert check', error);
      return;
    }

    for (const user of users) {
      try {
        await this.checkUserDevices(user);
      } catch (error) {
        this.logger.error(
          `Swarm alert check failed for user ${user.id}`,
          error,
        );
      }
    }

    this.logger.log('Swarm alert check completed');
  }

  private async checkUserDevices(user: {
    id: string;
    email: string;
    name: string | null;
  }): Promise<void> {
    const preferences = await this.usersService.getUserPreferences(user.id);

    if (!preferences?.swarmAlert?.enabled) {
      return; // Swarm alerts disabled for this user
    }

    const {
      weightDropKg = 2,
      measurementWindow = 3,
      lastAlertedAt = {},
    } = preferences.swarmAlert;

    // Fetch devices for this user
    let devices: HiveScaleDevice[];
    try {
      devices = (await this.hiveScaleService.listDevices(user.id)) as HiveScaleDevice[];
    } catch {
      // HiveScale may not be configured or the user has no devices
      return;
    }

    if (!Array.isArray(devices) || devices.length === 0) {
      return;
    }

    let preferencesChanged = false;
    const updatedLastAlertedAt = { ...lastAlertedAt };

    for (const device of devices) {
      const deviceId = device.id;

      // Check cooldown
      const lastAlerted = updatedLastAlertedAt[deviceId];
      if (lastAlerted) {
        const elapsed = Date.now() - new Date(lastAlerted).getTime();
        if (elapsed < ALERT_COOLDOWN_MS) {
          this.logger.debug(
            `Skipping device ${deviceId} for user ${user.id} – within cooldown window`,
          );
          continue;
        }
      }

      // Fetch the latest N+1 measurements so we can compare first vs last
      let measurements: HiveScaleMeasurement[];
      try {
        measurements = (await this.hiveScaleService.latestMeasurements(
          user.id,
          deviceId,
          measurementWindow + 1,
        )) as HiveScaleMeasurement[];
      } catch {
        continue;
      }

      if (!Array.isArray(measurements) || measurements.length < 2) {
        continue;
      }

      // Measurements are returned newest-first; reverse so index 0 = oldest
      const sorted = [...measurements].sort(
        (a, b) =>
          new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
      );

      // We check both scale channels
      for (const channel of ['scale_1', 'scale_2'] as const) {
        const weightKey =
          channel === 'scale_1' ? 'scale_1_weight_kg' : 'scale_2_weight_kg';
        const displayName =
          channel === 'scale_1'
            ? (device.scale_1_display_name ?? 'Scale 1')
            : (device.scale_2_display_name ?? 'Scale 2');

        // Extract the most recent `measurementWindow` values
        const window = sorted.slice(-measurementWindow);
        const validReadings = window
          .map((m) => m[weightKey] as number | null)
          .filter((w): w is number => w !== null && !isNaN(w));

        if (validReadings.length < 2) {
          continue;
        }

        const oldest = validReadings[0];
        const newest = validReadings[validReadings.length - 1];
        const drop = oldest - newest;

        this.logger.debug(
          `Device ${deviceId} ${channel}: oldest=${oldest} newest=${newest} drop=${drop} threshold=${weightDropKg}`,
        );

        if (drop >= weightDropKg) {
          this.logger.warn(
            `Swarm alert triggered for user ${user.id}, device ${deviceId}, ${channel}: drop=${drop.toFixed(2)} kg`,
          );

          const sent = await this.mailService.sendSwarmAlertEmail({
            email: user.email,
            userName: user.name,
            deviceId,
            deviceName: device.display_name ?? deviceId,
            scaleChannel: channel,
            scaleDisplayName: displayName,
            previousWeightKg: oldest,
            latestWeightKg: newest,
            dropKg: drop,
            measurementWindow,
            detectedAt: new Date().toISOString(),
          });

          if (sent) {
            // Record cooldown – use composite key so both channels can be tracked independently
            const cooldownKey = `${deviceId}__${channel}`;
            updatedLastAlertedAt[cooldownKey] = new Date().toISOString();
            preferencesChanged = true;
          }

          // Only alert once per device+channel per check run
          break;
        }
      }
    }

    if (preferencesChanged) {
      const updatedPreferences: UserPreferences = {
        ...preferences,
        swarmAlert: {
          ...preferences.swarmAlert!,
          lastAlertedAt: updatedLastAlertedAt,
        },
      };
      await this.usersService.updateUserPreferences(user.id, updatedPreferences);
    }
  }
}
