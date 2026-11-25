import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EquipmentService } from './equipment.service';
import { FeedTypesService } from './feed-types.service';
import { UsersStatsService } from './users-stats.service';
import { LoggerModule } from '../logger/logger.module';
import { MailModule } from '../mail/mail.module';
import { AdminUsersService } from './admin-users.service';

@Module({
  imports: [LoggerModule, MailModule],
  controllers: [UsersController],
  providers: [
    UsersService,
    EquipmentService,
    FeedTypesService,
    UsersStatsService,
    AdminUsersService,
  ],
  exports: [UsersService, EquipmentService, FeedTypesService],
})
export class UsersModule {}
