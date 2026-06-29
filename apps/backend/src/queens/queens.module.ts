import { Module } from '@nestjs/common';
import { QueensService } from './queens.service';
import { QueensController } from './queens.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';
import { PrometheusModule } from '../health/prometheus/prometheus.module';

@Module({
  imports: [LoggerModule, PrometheusModule],
  controllers: [QueensController],
  providers: [QueensService, PrismaService],
})
export class QueensModule {}
