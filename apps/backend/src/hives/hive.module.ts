import { Module } from '@nestjs/common';
import { HiveController } from './hive.controller';
import { HiveService } from './hive.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerModule } from '../logger/logger.module';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';
import { InspectionsModule } from '../inspections/inspections.module';
import { PrometheusModule } from '../health/prometheus/prometheus.module';

@Module({
  imports: [
    LoggerModule,
    ActionsModule,
    UsersModule,
    InspectionsModule,
    PrometheusModule,
  ],
  controllers: [HiveController],
  providers: [HiveService, PrismaService, MetricsService],
  exports: [HiveService],
})
export class HiveModule {}
