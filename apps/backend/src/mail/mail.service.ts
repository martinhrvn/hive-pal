import { Injectable, Logger } from '@nestjs/common';
import { passwordResetTemplate } from './templates/password-reset.template';
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

  /**
   * Get the current mail configuration status
   */
  getMailStatus() {
    return this.mailConfig.getProviderStatus();
  }
}
