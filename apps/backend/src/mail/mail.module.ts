import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailConfigService } from './mail-config.service';
import { ResendProvider } from './providers/resend.provider';
import { SmtpProvider } from './providers/smtp.provider';

@Module({
  providers: [
    MailService,
    MailConfigService,
    ResendProvider,
    SmtpProvider,
  ],
  exports: [MailService],
})
export class MailModule {}
