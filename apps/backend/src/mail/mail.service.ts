import { Injectable, Logger } from '@nestjs/common';
import { passwordResetTemplate } from './templates/password-reset.template';
import { swarmAlertTemplate } from './templates/swarm-alert.template';
import { magicLinkTemplate } from './templates/magic-link.template';
import { MailConfigService } from './mail-config.service';

export interface SwarmAlertEmailOptions {
  email: string;
  userName: string | null;
  deviceId: string;
  deviceName: string;
  scaleChannel: 'scale_1' | 'scale_2';
  scaleDisplayName: string;
  previousWeightKg: number;
  latestWeightKg: number;
  dropKg: number;
  measurementWindow: number;
  detectedAt: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailConfig: MailConfigService) {}

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<boolean> {
    const provider = this.mailConfig.getProvider();

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent password reset email to ${email}`,
      );
      return true;
    }

    try {
      const { subject, html } = passwordResetTemplate({
        email,
        resetUrl,
        appName: 'Hive Pal',
      });

      const result = await provider.sendEmail({
        from: this.mailConfig.getFromEmail(),
        to: [email],
        subject,
        html,
      });

      if (!result.success) {
        this.logger.error(
          `Failed to send password reset email via ${provider.getName()}:`,
          result.error,
        );
        return false;
      }

      this.logger.log(
        `Password reset email sent to ${email} via ${provider.getName()} with ID: ${result.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending password reset email:', error);
      return false;
    }
  }

  async sendSwarmAlertEmail(options: SwarmAlertEmailOptions): Promise<boolean> {
    const provider = this.mailConfig.getProvider();

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent swarm alert email to ${options.email} for device ${options.deviceId}`,
      );
      // Return true so the cooldown timestamp is still written even in dev
      return true;
    }

    try {
      const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const { subject, html } = swarmAlertTemplate({
        ...options,
        appName: 'Hive Pal',
        appUrl,
      });

      const result = await provider.sendEmail({
        from: this.mailConfig.getFromEmail(),
        to: [options.email],
        subject,
        html,
      });

      if (!result.success) {
        this.logger.error(
          `Failed to send swarm alert email via ${provider.getName()}:`,
          result.error,
        );
        return false;
      }

      this.logger.log(
        `Swarm alert email sent to ${options.email} for device ${options.deviceId} (${options.scaleChannel}) via ${provider.getName()} with ID: ${result.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending swarm alert email:', error);
      return false;
    }
  }

  async sendMagicLink(email: string, magicLinkUrl: string): Promise<boolean> {
    const provider = this.mailConfig.getProvider();

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent magic link to ${email}`,
      );
      return true;
    }

    try {
      const { subject, html } = magicLinkTemplate({
        email,
        magicLinkUrl,
        appName: 'Hive Pal',
      });

      const result = await provider.sendEmail({
        from: this.mailConfig.getFromEmail(),
        to: [email],
        subject,
        html,
      });

      if (!result.success) {
        this.logger.error(
          `Failed to send magic link via ${provider.getName()}:`,
          result.error,
        );
        return false;
      }

      this.logger.log(
        `Magic link sent to ${email} via ${provider.getName()} with ID: ${result.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending magic link:', error);
      return false;
    }
  }

  /**
   * Get the current mail configuration status
   */
  getMailStatus() {
    return this.mailConfig.getProviderStatus();
  }
}
