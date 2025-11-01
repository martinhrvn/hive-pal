import { Module } from '@nestjs/common';
import { BatchInspectionsService } from './batch-inspections.service';
import { BatchInspectionsController } from './batch-inspections.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [LoggerModule, InspectionsModule],
  controllers: [BatchInspectionsController],
  providers: [BatchInspectionsService, PrismaService],
  exports: [BatchInspectionsService],
})
export class BatchInspectionsModule {}
