import { Module } from '@nestjs/common';
import { FrameSizesController } from './frame-sizes.controller';
import { FrameSizesService } from './frame-sizes.service';

@Module({
  controllers: [FrameSizesController],
  providers: [FrameSizesService],
  exports: [FrameSizesService],
})
export class FrameSizesModule {}
