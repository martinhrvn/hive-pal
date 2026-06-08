import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ScheduleModule } from '@nestjs/schedule';
import { UsersModule } from '../users/users.module';
import { MailModule } from '../mail/mail.module';
import { HiveScaleController } from './hivescale.controller';
import { HiveScaleService } from './hivescale.service';
import { SwarmAlertService } from './swarm-alert.service';
import { SwarmAlertScheduler } from './swarm-alert.scheduler';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [HiveScaleController],
  providers: [HiveScaleService, SwarmAlertService, SwarmAlertScheduler],
})
export class HiveScaleModule {}
