import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrometheusModule } from './prometheus/prometheus.module';
import { LoggerModule } from '../logger/logger.module';
import { PrismaHealthIndicator } from './prisma/prisma.health';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [TerminusModule, HttpModule, PrometheusModule, LoggerModule],
  controllers: [HealthController],
  providers: [PrismaHealthIndicator, PrismaService],
})
export class HealthModule {}
