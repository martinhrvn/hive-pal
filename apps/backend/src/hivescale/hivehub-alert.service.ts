import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService, HiveHubAlertEmailItem } from '../mail/mail.service';
import {
  HiveHubDevice,
  HiveHubInsightHistoryAlert,
  HiveScaleService,
} from './hivescale.service';
import {
  resolveAlertPreferences,
  selectAlertsToNotify,
} from './hivehub-alert.rules';

/**
 * Emails HiveHub insight alerts (swarm, robbing, queenless, winter risk, …) to
 * the HivePal users who can see the device.
 *
 * HiveHub computes the alerts and keeps their lifecycle in its insight history;
 * this job only decides who still needs to hear about which one. It replaces
 * the old HivePal-side weight-drop "swarm alert", which duplicated the swarm
 * detector with less information and only covered two scales.
 */
@Injectable()
export class HiveHubAlertService {
  private readonly logger = new Logger(HiveHubAlertService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hiveScaleService: HiveScaleService,
    private readonly mailService: MailService,
  ) {}

  async checkAllUsers(): Promise<void> {
    if (!this.hiveScaleService.isConfigured()) {
      return;
    }

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        preferences: true,
      },
    });

    for (const user of users) {
      const prefs = resolveAlertPreferences(user.preferences);
      if (!prefs.enabled) continue;
      try {
        await this.checkUser(user, prefs.minSeverity);
      } catch (error) {
        this.logger.warn(
          `HiveHub alert check failed for user ${user.id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  }

  private async checkUser(
    user: { id: string; email: string; name: string | null; role: string },
    minSeverity: 'watch' | 'warning' | 'critical',
  ): Promise<void> {
    const token = this.hiveScaleService.tokenFor(user);
    const devices = await this.hiveScaleService.listDevices(token);

    const items: HiveHubAlertEmailItem[] = [];
    const toRecord: Array<{
      deviceId: string;
      alert: HiveHubInsightHistoryAlert;
    }> = [];

    for (const device of devices) {
      let active: HiveHubInsightHistoryAlert[];
      try {
        const history = await this.hiveScaleService.getDeviceInsightsHistory(
          token,
          device.device_id,
          { status: 'active', limit: 200 },
        );
        active = history.alerts ?? [];
      } catch (error) {
        this.logger.warn(
          `Could not read insights for ${device.device_id}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        continue;
      }

      const previous = await this.prisma.hiveHubAlertNotification.findMany({
        where: { userId: user.id, deviceId: device.device_id },
      });
      const notified = new Map(previous.map((n) => [n.alertId, n.severity]));

      for (const { alert, previousSeverity } of selectAlertsToNotify(
        active,
        notified,
        minSeverity,
      )) {
        items.push({
          deviceId: device.device_id,
          deviceName: device.display_name || device.device_id,
          hiveName: hiveName(device, alert.channel),
          severity: alert.peak_severity || alert.severity,
          previousSeverity,
          category: alert.category,
          title: alert.title,
          description: alert.description,
          confidence: alert.confidence,
          firstSeenAt: alert.first_seen_at,
        });
        toRecord.push({ deviceId: device.device_id, alert });
      }

      // Forget alerts that are no longer active so the table stays small.
      const activeIds = active.map((alert) => alert.id);
      await this.prisma.hiveHubAlertNotification.deleteMany({
        where: {
          userId: user.id,
          deviceId: device.device_id,
          alertId: { notIn: activeIds },
        },
      });
    }

    if (items.length === 0) return;

    const sent = await this.mailService.sendHiveHubAlertEmail({
      email: user.email,
      userName: user.name,
      items,
    });
    if (!sent) return;

    for (const { deviceId, alert } of toRecord) {
      const severity = alert.peak_severity || alert.severity;
      await this.prisma.hiveHubAlertNotification.upsert({
        where: {
          userId_deviceId_alertId: {
            userId: user.id,
            deviceId,
            alertId: alert.id,
          },
        },
        create: { userId: user.id, deviceId, alertId: alert.id, severity },
        update: { severity, notifiedAt: new Date() },
      });
    }
    this.logger.log(`Sent ${items.length} HiveHub alert(s) to user ${user.id}`);
  }
}

function hiveName(
  device: HiveHubDevice,
  channel: number | null,
): string | null {
  if (!channel) return null;
  const names = device.channels?.names ?? {};
  const legacy =
    channel === 1
      ? device.channels?.scale_1
      : channel === 2
        ? device.channels?.scale_2
        : null;
  return names[String(channel)] || legacy || `Hive ${channel}`;
}
