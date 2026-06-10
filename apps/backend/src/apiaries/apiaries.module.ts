import { Module } from '@nestjs/common';
import { ApiariesService } from './apiaries.service';
import { ApiariesController } from './apiaries.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';
import { PrometheusModule } from '../health/prometheus/prometheus.module';

@Module({
  imports: [LoggerModule, PrometheusModule],
  controllers: [ApiariesController],
  providers: [ApiariesService, PrismaService],
})
export class ApiariesModule {}
