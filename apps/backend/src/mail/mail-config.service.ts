import { Injectable, Logger } from '@nestjs/common';
import { ResendProvider } from './providers/resend.provider';
import { SmtpProvider } from './providers/smtp.provider';
import { MailProvider } from './providers/mail-provider.interface';

export enum MailProviderType {
  RESEND = 'resend',
  SMTP = 'smtp',
  NONE = 'none',
}

@Injectable()
export class MailConfigService {
  private readonly logger = new Logger(MailConfigService.name);
  private selectedProvider: MailProvider | null = null;
  private readonly providerType: MailProviderType;
  private readonly fromEmail: string;
  private readonly emailEnabled: boolean;

  constructor(
    private readonly resendProvider: ResendProvider,
    private readonly smtpProvider: SmtpProvider,
  ) {
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@hivepal.com';

    // Determine which provider to use
    const forcedProvider = process.env.MAIL_PROVIDER?.toLowerCase();

    if (forcedProvider === 'resend' && this.resendProvider.isConfigured()) {
      this.selectedProvider = this.resendProvider;
      this.providerType = MailProviderType.RESEND;
    } else if (forcedProvider === 'smtp' && this.smtpProvider.isConfigured()) {
      this.selectedProvider = this.smtpProvider;
      this.providerType = MailProviderType.SMTP;
    } else if (forcedProvider === 'none') {
      this.selectedProvider = null;
      this.providerType = MailProviderType.NONE;
    } else {
      // Auto-select: Resend first, then SMTP
      if (this.resendProvider.isConfigured()) {
        this.selectedProvider = this.resendProvider;
        this.providerType = MailProviderType.RESEND;
      } else if (this.smtpProvider.isConfigured()) {
        this.selectedProvider = this.smtpProvider;
        this.providerType = MailProviderType.SMTP;
      } else {
        this.selectedProvider = null;
        this.providerType = MailProviderType.NONE;
      }
    }

    this.emailEnabled = this.selectedProvider !== null;

    if (this.emailEnabled && this.selectedProvider) {
      this.logger.log(
        `Email service initialized with provider: ${this.selectedProvider.getName()}`,
      );
    } else {
      this.logger.warn('Email functionality disabled - no provider configured');
      this.logger.debug('To enable email, configure either:');
      this.logger.debug('  - Resend: Set RESEND_API_KEY');
      this.logger.debug('  - SMTP: Set SMTP_HOST, SMTP_USER, and SMTP_PASS');
    }
  }

  getProvider(): MailProvider | null {
    return this.selectedProvider;
  }

  getProviderType(): MailProviderType {
    return this.providerType;
  }

  getFromEmail(): string {
    return this.fromEmail;
  }

  isEmailEnabled(): boolean {
    return this.emailEnabled;
  }

  getProviderStatus(): {
    enabled: boolean;
    provider: string;
    from: string;
    availableProviders: {
      resend: boolean;
      smtp: boolean;
    };
  } {
    return {
      enabled: this.emailEnabled,
      provider: this.providerType,
      from: this.fromEmail,
      availableProviders: {
        resend: this.resendProvider.isConfigured(),
        smtp: this.smtpProvider.isConfigured(),
      },
    };
  }
}
