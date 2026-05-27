import { Module } from '@nestjs/common';
import { WorkerTokensController } from './worker-tokens.controller';
import { WorkerTokensService } from './worker-tokens.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [WorkerTokensController],
  providers: [WorkerTokensService, PrismaService],
  exports: [WorkerTokensService],
})
export class WorkerTokensModule {}
