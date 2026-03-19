import { Injectable, Logger } from '@nestjs/common';
import { passwordResetTemplate } from './templates/password-reset.template';
import { apiaryInviteTemplate } from './templates/apiary-invite.template';
import { joinRequestOwnerTemplate } from './templates/join-request-owner.template';
import { joinRequestResultTemplate } from './templates/join-request-result.template';
import { MailConfigService } from './mail-config.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailConfig: MailConfigService) {}

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const provider = this.mailConfig.getProvider();

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent password reset email to ${email}`,
      );
      return true;
    }

    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

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

  async sendApiaryInviteEmail(
    email: string,
    token: string,
    apiaryName: string,
    inviterName: string,
  ): Promise<boolean> {
    const provider = this.mailConfig.getProvider();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const inviteUrl = `${frontendUrl}/invitations/accept/${token}`;

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent apiary invite to ${email} (url: ${inviteUrl})`,
      );
      return true;
    }

    try {
      const { subject, html } = apiaryInviteTemplate({
        inviteUrl,
        apiaryName,
        inviterName,
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
          `Failed to send apiary invite email via ${provider.getName()}:`,
          result.error,
        );
        return false;
      }

      this.logger.log(`Apiary invite email sent to ${email}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending apiary invite email:', error);
      return false;
    }
  }

  /**
   * Get the current mail configuration status
   */
  getMailStatus() {
    return this.mailConfig.getProviderStatus();
  }

  async sendJoinRequestOwnerEmail(
    ownerEmail: string,
    requesterName: string,
    requesterEmail: string,
    apiaryName: string,
    approveToken: string,
    denyToken: string,
  ): Promise<boolean> {
    const provider = this.mailConfig.getProvider();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const approveUrl = `${frontendUrl}/join-requests/approve/${approveToken}`;
    const denyUrl = `${frontendUrl}/join-requests/deny/${denyToken}`;

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent join request email to owner ${ownerEmail} (approve: ${approveUrl})`,
      );
      return true;
    }

    try {
      const { subject, html } = joinRequestOwnerTemplate({
        requesterName,
        requesterEmail,
        apiaryName,
        approveUrl,
        denyUrl,
        appName: 'Hive Pal',
      });

      const result = await provider.sendEmail({
        from: this.mailConfig.getFromEmail(),
        to: [ownerEmail],
        subject,
        html,
      });

      if (!result.success) {
        this.logger.error(`Failed to send join request email to owner ${ownerEmail}:`, result.error);
        return false;
      }

      this.logger.log(`Join request email sent to owner ${ownerEmail}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending join request owner email:', error);
      return false;
    }
  }

  async sendJoinRequestResultEmail(
    requesterEmail: string,
    requesterName: string,
    apiaryName: string,
    approved: boolean,
  ): Promise<boolean> {
    const provider = this.mailConfig.getProvider();
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    if (!provider) {
      this.logger.log(
        `Email sending disabled - would have sent join request result (${approved ? 'approved' : 'denied'}) to ${requesterEmail}`,
      );
      return true;
    }

    try {
      const { subject, html } = joinRequestResultTemplate({
        requesterName,
        apiaryName,
        approved,
        dashboardUrl: frontendUrl,
        appName: 'Hive Pal',
      });

      const result = await provider.sendEmail({
        from: this.mailConfig.getFromEmail(),
        to: [requesterEmail],
        subject,
        html,
      });

      if (!result.success) {
        this.logger.error(`Failed to send join request result email to ${requesterEmail}:`, result.error);
        return false;
      }

      this.logger.log(`Join request result email sent to ${requesterEmail}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending join request result email:', error);
      return false;
    }
  }
}
