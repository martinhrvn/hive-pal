import { Module } from '@nestjs/common';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { PrismaService } from '../prisma/prisma.service';
import { ActionsService } from '../actions/actions.service';
import { MetricsService } from '../metrics/metrics.service';
import { InspectionStatusUpdaterService } from '../inspections/inspection-status-updater.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [CalendarController],
  providers: [
    CalendarService,
    PrismaService,
    ActionsService,
    MetricsService,
    InspectionStatusUpdaterService,
  ],
  exports: [CalendarService],
})
export class CalendarModule {}