import { Module } from '@nestjs/common';
import { HiveController } from './hive.controller';
import { HiveService } from './hive.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { InspectionsService } from '../inspections/inspections.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerModule } from '../logger/logger.module';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';
import { InspectionStatusUpdaterService } from '../inspections/inspection-status-updater.service';

@Module({
  imports: [AuthModule, LoggerModule, ActionsModule, UsersModule],
  controllers: [HiveController],
  providers: [
    HiveService,
    PrismaService,
    MetricsService,
    InspectionsService,
    InspectionStatusUpdaterService,
  ],
})
export class HiveModule {}
