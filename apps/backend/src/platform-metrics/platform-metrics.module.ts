import { Module } from '@nestjs/common';
import { PlatformMetricsController } from './platform-metrics.controller';
import { PlatformMetricsService } from './platform-metrics.service';
import { PlatformMetricsScheduler } from './platform-metrics.scheduler';

@Module({
  controllers: [PlatformMetricsController],
  providers: [PlatformMetricsService, PlatformMetricsScheduler],
  exports: [PlatformMetricsService],
})
export class PlatformMetricsModule {}
