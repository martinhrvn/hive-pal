import { Module, forwardRef } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { InspectionStatusUpdaterService } from './inspection-status-updater.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerModule } from '../logger/logger.module';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';
import { InspectionAudioModule } from '../inspection-audio/inspection-audio.module';

@Module({
  imports: [
    LoggerModule,
    ActionsModule,
    UsersModule,
    forwardRef(() => InspectionAudioModule),
  ],
  controllers: [InspectionsController],
  providers: [
    InspectionsService,
    InspectionStatusUpdaterService,
    PrismaService,
    MetricsService,
  ],
  exports: [InspectionsService],
})
export class InspectionsModule {}
