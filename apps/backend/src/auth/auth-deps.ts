import type { EventEmitter2 } from '@nestjs/event-emitter';
import type { PrismaService } from '../prisma/prisma.service';
import type { MailService } from '../mail/mail.service';

class AuthDepsContainer {
  eventEmitter!: EventEmitter2;
  prisma!: PrismaService;
  mail!: MailService;
}

export const authDeps = new AuthDepsContainer();
