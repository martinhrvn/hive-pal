import { Module } from '@nestjs/common';
import { MeasurementsController } from './measurements.controller';
import { MeasurementsService } from './measurements.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [MeasurementsController],
  providers: [MeasurementsService, PrismaService],
  exports: [MeasurementsService],
})
export class MeasurementsModule {}
