import { Module, OnModuleInit, Global } from '@nestjs/common';
import { AuthModule as ThallespAuthModule } from '@thallesp/nestjs-better-auth';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { MailModule } from '../mail/mail.module';
import { auth } from './better-auth';
import { authDeps } from './auth-deps';

@Global()
@Module({
  imports: [
    MailModule,
    ThallespAuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
  exports: [ThallespAuthModule],
})
export class BetterAuthModule implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    authDeps.prisma = this.prisma;
    authDeps.mail = this.mail;
    authDeps.eventEmitter = this.eventEmitter;
  }
}
