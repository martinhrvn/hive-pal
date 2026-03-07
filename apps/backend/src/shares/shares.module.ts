import { Module } from '@nestjs/common';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { ShareImageService } from './image/share-image.service';
import { PrismaService } from '../prisma/prisma.service';
import { MetricsService } from '../metrics/metrics.service';
import { HarvestsModule } from '../harvests/harvests.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [HarvestsModule, InspectionsModule],
  controllers: [SharesController],
  providers: [SharesService, ShareImageService, PrismaService, MetricsService],
  exports: [SharesService],
})
export class SharesModule {}
