import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { ICalService } from './ical.service';
import { ICalTokenService } from './ical-token.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';
import { AuthModule } from '../auth/auth.module';
import { MetricsService } from '../metrics/metrics.service';
import { InspectionStatusUpdaterService } from '../inspections/inspection-status-updater.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule, ActionsModule, UsersModule, AuthModule],
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
