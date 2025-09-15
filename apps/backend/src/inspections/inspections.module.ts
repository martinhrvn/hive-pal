import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { InspectionStatusUpdaterService } from './inspection-status-updater.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerModule } from '../logger/logger.module';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [LoggerModule, ActionsModule, UsersModule],
  controllers: [InspectionsController],
  providers: [
    InspectionsService,
    InspectionStatusUpdaterService,
    PrismaService,
    MetricsService,
  ],
})
export class InspectionsModule {}
