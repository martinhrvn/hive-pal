import { Module } from '@nestjs/common';
import { PlatformMetricsController } from './platform-metrics.controller';
import { PlatformMetricsService } from './platform-metrics.service';
import { PlatformMetricsScheduler } from './platform-metrics.scheduler';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PlatformMetricsController],
  providers: [PlatformMetricsService, PlatformMetricsScheduler, PrismaService],
  exports: [PlatformMetricsService],
})
export class PlatformMetricsModule {}
