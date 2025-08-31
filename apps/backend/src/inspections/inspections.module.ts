import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { InspectionStatusUpdaterService } from './inspection-status-updater.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerModule } from '../logger/logger.module';
import { ActionsService } from '../actions/actions.service';

@Module({
  imports: [LoggerModule],
  controllers: [InspectionsController],
  providers: [
    InspectionsService,
    InspectionStatusUpdaterService,
    PrismaService,
    MetricsService,
    ActionsService,
  ],
})
export class InspectionsModule {}
