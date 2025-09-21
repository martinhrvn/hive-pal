import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';
import {
  MailProvider,
  EmailOptions,
  EmailResult,
} from './mail-provider.interface';

@Injectable()
export class ResendProvider implements MailProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly resend: Resend | null;
  private readonly apiKey: string | undefined;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY;

    if (this.apiKey) {
      this.resend = new Resend(this.apiKey);
      this.logger.log('Resend provider initialized');
    } else {
      this.resend = null;
      this.logger.debug('Resend API key not provided');
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.resend) {
      return {
        success: false,
        error: 'Resend is not configured',
      };
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: options.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        this.logger.error('Resend error:', error);
        return {
          success: false,
          error: error.message || 'Failed to send email via Resend',
        };
      }

      this.logger.log(`Email sent via Resend with ID: ${data?.id}`);
      return {
        success: true,
        id: data?.id,
      };
    } catch (error) {
      this.logger.error('Error sending email via Resend:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  getName(): string {
    return 'Resend';
  }
}
