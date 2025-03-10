import { Module } from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { InspectionsController } from './inspections.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

@Module({
  controllers: [InspectionsController],
  providers: [InspectionsService, PrismaService, MetricsService],
})
export class InspectionsModule {}
