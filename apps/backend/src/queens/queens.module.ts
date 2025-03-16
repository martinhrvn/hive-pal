import { Module } from '@nestjs/common';
import { QueensService } from './queens.service';
import { QueensController } from './queens.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [QueensController],
  providers: [QueensService, PrismaService],
})
export class QueensModule {}
