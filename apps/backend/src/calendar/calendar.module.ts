import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';
import { MetricsService } from '../metrics/metrics.service';
import { InspectionStatusUpdaterService } from '../inspections/inspection-status-updater.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule, ActionsModule, UsersModule],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    PrismaService,
    MetricsService,
    InspectionStatusUpdaterService,
  ],
  exports: [CalendarService],
})
export class CalendarModule {}
