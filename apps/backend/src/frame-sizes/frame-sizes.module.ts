import { Module } from '@nestjs/common';
import { FrameSizesController } from './frame-sizes.controller';
import { FrameSizesService } from './frame-sizes.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [FrameSizesController],
  providers: [FrameSizesService, PrismaService],
  exports: [FrameSizesService],
})
export class FrameSizesModule {}
