import { Module } from '@nestjs/common';
import { WorkerJobsController } from './worker-jobs.controller';
import { WorkerJobsService } from './worker-jobs.service';
import { LeaseSweeperService } from './lease-sweeper.service';
import { WorkerTokenAuthGuard } from './worker-token-auth.guard';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [WorkerJobsController],
  providers: [WorkerJobsService, LeaseSweeperService, WorkerTokenAuthGuard],
  exports: [WorkerJobsService],
})
export class WorkerJobsModule {}
