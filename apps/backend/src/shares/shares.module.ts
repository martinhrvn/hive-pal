import { Module } from '@nestjs/common';
import { SharesController } from './shares.controller';
import { SharesService } from './shares.service';
import { ShareImageService } from './image/share-image.service';
import { PrismaService } from '../prisma/prisma.service';
import { HarvestsModule } from '../harvests/harvests.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [HarvestsModule, InspectionsModule],
  controllers: [SharesController],
  providers: [SharesService, ShareImageService, PrismaService],
  exports: [SharesService],
})
export class SharesModule {}
