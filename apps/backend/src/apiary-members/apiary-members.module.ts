import { Module } from '@nestjs/common';
import { ApiaryMembersController } from './apiary-members.controller';
import { ApiaryMembersService } from './apiary-members.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';
import { CustomLoggerService } from '../logger/logger.service';

@Module({
  imports: [MailModule],
  controllers: [ApiaryMembersController],
  providers: [ApiaryMembersService, PrismaService, CustomLoggerService],
  exports: [ApiaryMembersService],
})
export class ApiaryMembersModule {}
