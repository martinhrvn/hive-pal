import { Module } from '@nestjs/common';
import { HiveController } from './hive.controller';
import { HiveService } from './hive.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { InspectionsService } from '../inspections/inspections.service';
import { MetricsService } from '../metrics/metrics.service';

@Module({
  imports: [AuthModule],
  controllers: [HiveController],
  providers: [HiveService, PrismaService, MetricsService, InspectionsService],
})
export class HiveModule {}
