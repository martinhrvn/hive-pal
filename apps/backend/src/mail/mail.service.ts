import { Injectable, Logger } from '@nestjs/common';
import { passwordResetTemplate } from './templates/password-reset.template';
import {
  hiveHubAlertTemplate,
  HiveHubAlertTemplateItem,
} from './templates/hivehub-alert.template';
import { magicLinkTemplate } from './templates/magic-link.template';
import { accountSetupTemplate } from './templates/account-setup.template';
import { MailConfigService } from './mail-config.service';

export interface HiveHubAlertEmailItem extends HiveHubAlertTemplateItem {
  deviceId: string;
}

export interface HiveHubAlertEmailOptions {
  email: string;
  userName: string | null;
  items: HiveHubAlertEmailItem[];
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailConfig: MailConfigService) {}

  async sendPasswordResetEmail(
    email: string,
    resetUrl: string,
  ): Promise<boolean> {
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

  async sendHiveHubAlertEmail(
    options: HiveHubAlertEmailOptions,
  ): Promise<boolean> {
    const provider = this.mailConfig.getProvider();

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent ${options.items.length} HiveHub alert(s) to ${options.email}`,
      );
      // Return true so the alerts are still marked as notified in dev
      return true;
    }

    try {
      const appUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      const { subject, html } = hiveHubAlertTemplate({
        userName: options.userName,
        items: options.items,
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
          `Failed to send HiveHub alert email via ${provider.getName()}:`,
          result.error,
        );
        return false;
      }

      this.logger.log(
        `HiveHub alert email (${options.items.length} alert(s)) sent to ${options.email} via ${provider.getName()} with ID: ${result.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending HiveHub alert email:', error);
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
   * Sends the "set your password" link for an account an admin created.
   * Unlike the other mails this reports `false` when mail is not configured:
   * the admin asked for the email, so silently skipping it would strand the
   * user without a password.
   */
  async sendAccountSetupEmail(
    email: string,
    setupUrl: string,
    expiresInHours: number,
  ): Promise<boolean> {
    const provider = this.mailConfig.getProvider();
    if (!provider) {
      this.logger.warn(
        `Email sending disabled - cannot send account setup link to ${email}`,
      );
      return false;
    }

    try {
      const { subject, html } = accountSetupTemplate({
        email,
        setupUrl,
        appName: 'Hive Pal',
        expiresInHours,
      });
      const result = await provider.sendEmail({
        from: this.mailConfig.getFromEmail(),
        to: [email],
        subject,
        html,
      });
      if (!result.success) {
        this.logger.error(
          `Failed to send account setup email via ${provider.getName()}:`,
          result.error,
        );
        return false;
      }
      this.logger.log(
        `Account setup email sent to ${email} via ${provider.getName()} with ID: ${result.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending account setup email:', error);
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
