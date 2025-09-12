import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { passwordResetTemplate } from './templates/password-reset.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    this.resend = new Resend(apiKey);
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@hivepal.com';
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

      const { subject, html } = passwordResetTemplate({
        email,
        resetUrl,
        appName: 'Hive Pal',
      });

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject,
        html,
      });

      if (error) {
        this.logger.error('Failed to send password reset email', error);
        return false;
      }

      this.logger.log(
        `Password reset email sent to ${email} with ID: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error('Error sending password reset email:', error);
      return false;
    }
  }
}
