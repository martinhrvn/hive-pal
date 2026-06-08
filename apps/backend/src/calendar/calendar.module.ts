import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { ICalService } from './ical.service';
import { ICalTokenService } from './ical-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';
import { MetricsService } from '../metrics/metrics.service';
import { InspectionStatusUpdaterService } from '../inspections/inspection-status-updater.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    ActionsModule,
    UsersModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? 'dev-ical-secret',
      signOptions: { expiresIn: '365d' },
    }),
  ],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    ICalService,
    ICalTokenService,
    PrismaService,
    MetricsService,
    InspectionStatusUpdaterService,
  ],
  exports: [CalendarService],
})
export class CalendarModule {}
