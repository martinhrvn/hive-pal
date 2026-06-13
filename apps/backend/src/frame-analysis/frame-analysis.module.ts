import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { FrameAiService } from './frame-ai.service';
import { FrameAnalysisController } from './frame-analysis.controller';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [HttpModule, ConfigModule, LoggerModule],
  controllers: [FrameAnalysisController],
  providers: [FrameAiService, PrismaService],
  exports: [FrameAiService],
})
export class FrameAnalysisModule {}
