import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.interface';

const STUCK_AFTER_MS = 60 * 60 * 1000;

@Injectable()
export class AccountTransferSweeperService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly storage: StorageService,
  ) {
    this.logger.setContext('AccountTransferSweeperService');
  }

  async onModuleInit(): Promise<void> {
    // On startup, any RUNNING job was orphaned by a crash/restart
    const stuck = await this.prisma.accountTransferJob.findMany({
      where: { status: 'RUNNING' },
      select: { id: true },
    });
    if (stuck.length > 0) {
      await this.prisma.accountTransferJob.updateMany({
        where: { id: { in: stuck.map((s) => s.id) } },
        data: {
          status: 'FAILED',
          errorMessage: 'Server restarted during processing',
          finishedAt: new Date(),
        },
      });
      this.logger.warn({
        message: 'Marked orphaned account-transfer jobs as failed',
        count: stuck.length,
      });
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async sweepStuck(): Promise<void> {
    const cutoff = new Date(Date.now() - STUCK_AFTER_MS);
    const stuck = await this.prisma.accountTransferJob.findMany({
      where: { status: 'RUNNING', startedAt: { lt: cutoff } },
      select: { id: true },
    });
    for (const job of stuck) {
      await this.prisma.accountTransferJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: 'Job exceeded maximum runtime',
          finishedAt: new Date(),
        },
      });
      this.logger.warn({
        message: 'Account-transfer job exceeded runtime; marked FAILED',
        jobId: job.id,
      });
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async purgeExpiredResults(): Promise<void> {
    const now = new Date();
    const expired = await this.prisma.accountTransferJob.findMany({
      where: {
        type: 'EXPORT',
        status: 'COMPLETED',
        resultStorageKey: { not: null },
        resultExpiresAt: { lt: now },
      },
      select: { id: true, resultStorageKey: true },
    });
    for (const job of expired) {
      if (job.resultStorageKey) {
        try {
          await this.storage.deleteObject(job.resultStorageKey);
        } catch (err) {
          this.logger.warn({
            message: 'Failed to delete expired export result',
            jobId: job.id,
            error: (err as Error).message,
          });
        }
      }
      await this.prisma.accountTransferJob.update({
        where: { id: job.id },
        data: { resultStorageKey: null },
      });
    }
    if (expired.length > 0) {
      this.logger.log({
        message: 'Purged expired account-transfer export results',
        count: expired.length,
      });
    }
  }
}
