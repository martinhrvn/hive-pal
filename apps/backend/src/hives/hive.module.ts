import { Module } from '@nestjs/common';
import { HiveController } from './hive.controller';
import { HiveService } from './hive.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { InspectionsService } from '../inspections/inspections.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [AuthModule, LoggerModule],
  controllers: [HiveController],
  providers: [HiveService, PrismaService, MetricsService, InspectionsService],
})
export class HiveModule {}
