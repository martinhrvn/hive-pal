import { Module } from '@nestjs/common';
import { BatchInspectionsService } from './batch-inspections.service';
import { BatchInspectionsController } from './batch-inspections.controller';
import { LoggerModule } from '../logger/logger.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [LoggerModule, InspectionsModule],
  controllers: [BatchInspectionsController],
  providers: [BatchInspectionsService],
  exports: [BatchInspectionsService],
})
export class BatchInspectionsModule {}
