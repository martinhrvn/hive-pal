import { Module } from '@nestjs/common';
import { QueensService } from './queens.service';
import { QueensController } from './queens.controller';

@Module({
  controllers: [QueensController],
  providers: [QueensService],
})
export class QueensModule {}
