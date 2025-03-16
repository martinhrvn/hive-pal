import { Module } from '@nestjs/common';
import { PrometheusController } from './prometheus.controller';
import { PrometheusService } from './prometheus.service';
import { PrometheusInterceptor } from './prometheus.interceptor';
import { LoggerModule } from '../../logger/logger.module';
import { APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [LoggerModule],
  controllers: [PrometheusController],
  providers: [
    PrometheusService,
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
  ],
  exports: [PrometheusService],
})
export class PrometheusModule {}
