import { Module } from '@nestjs/common';
import { QueensService } from './queens.service';
import { QueensController } from './queens.controller';
import { LoggerModule } from '../logger/logger.module';
import { PrometheusModule } from '../health/prometheus/prometheus.module';

@Module({
  imports: [LoggerModule, PrometheusModule],
  controllers: [QueensController],
  providers: [QueensService],
  exports: [QueensService],
})
export class QueensModule {}
