import { Module } from '@nestjs/common';
import { WorkerTokensController } from './worker-tokens.controller';
import { WorkerTokensService } from './worker-tokens.service';

@Module({
  controllers: [WorkerTokensController],
  providers: [WorkerTokensService],
  exports: [WorkerTokensService],
})
export class WorkerTokensModule {}
