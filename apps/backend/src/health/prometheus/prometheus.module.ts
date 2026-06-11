import { Module } from '@nestjs/common';
import { PrometheusService } from './prometheus.service';
import { PrometheusInterceptor } from './prometheus.interceptor';
import { LoggerModule } from '../../logger/logger.module';
import { PrismaService } from '../../prisma/prisma.service';
import { APP_INTERCEPTOR } from '@nestjs/core';

// Note: metrics are exposed via a standalone HTTP server on a dedicated
// internal port (see metrics-server.ts), not through a NestJS controller, so
// the `/metrics` surface stays off the public API. This module still provides
// PrometheusService + the interceptor that populate the global registry.
// PrismaService is provided locally (PrismaModule is not @Global) so the
// business-total gauges can read live DB counts at scrape time.
@Module({
  imports: [LoggerModule],
  providers: [
    PrometheusService,
    PrismaService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
  ],
  exports: [PrometheusService],
})
export class PrometheusModule {}
