import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { HiveScaleController } from './hivescale.controller';
import { HiveScaleService } from './hivescale.service';
import { SwarmAlertService } from './swarm-alert.service';
import { SwarmAlertScheduler } from './swarm-alert.scheduler';

@Module({
  imports: [AuthModule, ConfigModule, UsersModule, MailModule, ScheduleModule.forRoot()],
  controllers: [HiveScaleController],
  providers: [HiveScaleService, SwarmAlertService, SwarmAlertScheduler],
})
export class HiveScaleModule {}
