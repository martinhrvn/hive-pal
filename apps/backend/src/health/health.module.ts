import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrometheusModule } from './prometheus/prometheus.module';
import { LoggerModule } from '../logger/logger.module';
import { PrismaHealthIndicator } from './prisma/prisma.health';

@Module({
  imports: [TerminusModule, HttpModule, PrometheusModule, LoggerModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator],
})
export class HealthModule {}
