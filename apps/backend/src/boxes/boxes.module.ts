import { Module } from '@nestjs/common';
import { BoxesService } from './boxes.service';
import { BoxesController } from './boxes.controller';

@Module({
  controllers: [BoxesController],
  providers: [BoxesService],
})
export class BoxesModule {}
