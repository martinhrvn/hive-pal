import { Module } from '@nestjs/common';
import { QueensService } from './queens.service';
import { QueensController } from './queens.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [QueensController],
  providers: [QueensService, PrismaService],
})
export class QueensModule {}
