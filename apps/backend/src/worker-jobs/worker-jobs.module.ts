import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { WorkerJobsController } from './worker-jobs.controller';
import { WorkerJobsService } from './worker-jobs.service';
import { LeaseSweeperService } from './lease-sweeper.service';
import { WorkerTokenAuthGuard } from './worker-token-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [ScheduleModule.forRoot(), LoggerModule],
  controllers: [WorkerJobsController],
  providers: [
    WorkerJobsService,
    LeaseSweeperService,
    WorkerTokenAuthGuard,
    PrismaService,
  ],
  exports: [WorkerJobsService],
})
export class WorkerJobsModule {}
