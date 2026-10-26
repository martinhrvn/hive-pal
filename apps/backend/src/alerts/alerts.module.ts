import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsScheduler } from './alerts.scheduler';
import { AlertsEventHandler } from './alerts.event-handler';
import { CustomLoggerService } from '../logger/logger.service';
import { InspectionOverdueChecker, VirginQueenChecker } from './checkers';

@Module({
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertsScheduler,
    AlertsEventHandler,
    CustomLoggerService,
    InspectionOverdueChecker,
    VirginQueenChecker,
  ],
  exports: [AlertsService, AlertsScheduler],
})
export class AlertsModule {}
