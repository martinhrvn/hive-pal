import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailProvider, EmailOptions, EmailResult } from './mail-provider.interface';

@Injectable()
export class SmtpProvider implements MailProvider {
  private readonly logger = new Logger(SmtpProvider.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly isConfigured: boolean;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    this.isConfigured = !!(host && user && pass);

    if (this.isConfigured) {
      try {
        this.transporter = nodemailer.createTransporter({
          host,
          port,
          secure,
          auth: {
            user,
            pass,
          },
          tls: {
            rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED !== 'false',
          },
        });

        this.logger.log(`SMTP provider initialized with host: ${host}:${port}`);
        
        // Verify connection configuration
        this.verifyConnection();
      } catch (error) {
        this.logger.error('Failed to create SMTP transporter:', error);
        this.transporter = null;
      }
    } else {
      this.logger.debug('SMTP configuration not provided');
    }
  }

  private async verifyConnection(): Promise<void> {
    if (!this.transporter) return;

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      this.logger.warn('SMTP connection verification failed:', error);
    }
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    if (!this.transporter) {
      return {
        success: false,
        error: 'SMTP is not configured',
      };
    }

    try {
      const info = await this.transporter.sendMail({
        from: options.from,
        to: options.to.join(', '),
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      this.logger.log(`Email sent via SMTP with ID: ${info.messageId}`);
      return {
        success: true,
        id: info.messageId,
      };
    } catch (error) {
      this.logger.error('Error sending email via SMTP:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isConfigured(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  getName(): string {
    return 'SMTP';
  }
}