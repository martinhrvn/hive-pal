import { Module } from '@nestjs/common';
import { ApiaryJoinRequestsController } from './apiary-join-requests.controller';
import { ApiaryJoinRequestsService } from './apiary-join-requests.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { CustomLoggerService } from '../logger/logger.service';

@Module({
  imports: [MailModule],
  controllers: [ApiaryJoinRequestsController],
  providers: [ApiaryJoinRequestsService, PrismaService, CustomLoggerService],
})
export class ApiaryJoinRequestsModule {}
