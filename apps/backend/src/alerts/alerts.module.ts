import { Module } from '@nestjs/common';
import { AlertsController } from './alerts.controller';
import { AlertsService } from './alerts.service';
import { AlertsScheduler } from './alerts.scheduler';
import { AlertsEventHandler } from './alerts.event-handler';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { InspectionOverdueChecker } from './checkers';

@Module({
  controllers: [AlertsController],
  providers: [
    AlertsService,
    AlertsScheduler,
    AlertsEventHandler,
    PrismaService,
    CustomLoggerService,
    InspectionOverdueChecker,
  ],
  exports: [AlertsService, AlertsScheduler],
})
export class AlertsModule {}
