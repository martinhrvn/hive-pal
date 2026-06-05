import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.interface';
import type {
  AccountTransferJob,
  AccountTransferJobType,
} from '../generated/prisma/client.js';

@Injectable()
export class AccountTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
    private readonly storage: StorageService,
  ) {
    this.logger.setContext('AccountTransferService');
  }

  async ensureNoActiveJob(
    userId: string,
    type: AccountTransferJobType,
  ): Promise<void> {
    const existing = await this.prisma.accountTransferJob.findFirst({
      where: {
        userId,
        type,
        status: { in: ['PENDING', 'RUNNING'] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(
        `An ${type.toLowerCase()} job is already in progress.`,
      );
    }
  }

  async createJob(
    userId: string,
    type: AccountTransferJobType,
    inputStorageKey: string | null = null,
  ): Promise<AccountTransferJob> {
    await this.ensureNoActiveJob(userId, type);
    return this.prisma.accountTransferJob.create({
      data: {
        userId,
        type,
        status: 'PENDING',
        inputStorageKey,
      },
    });
  }

  async listJobs(userId: string, limit = 20): Promise<AccountTransferJob[]> {
    return this.prisma.accountTransferJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getJob(userId: string, jobId: string): Promise<AccountTransferJob> {
    const job = await this.prisma.accountTransferJob.findFirst({
      where: { id: jobId, userId },
    });
    if (!job) {
      throw new NotFoundException('Job not found');
    }
    return job;
  }

  async markRunning(jobId: string): Promise<void> {
    await this.prisma.accountTransferJob.update({
      where: { id: jobId },
      data: { status: 'RUNNING', startedAt: new Date() },
    });
  }

  async setProgress(jobId: string, progress: string): Promise<void> {
    await this.prisma.accountTransferJob.update({
      where: { id: jobId },
      data: { progress },
    });
  }

  async markCompleted(
    jobId: string,
    data: {
      summary?: unknown;
      resultStorageKey?: string | null;
      resultExpiresAt?: Date | null;
    },
  ): Promise<void> {
    await this.prisma.accountTransferJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        finishedAt: new Date(),
        summary: data.summary as never,
        resultStorageKey: data.resultStorageKey ?? null,
        resultExpiresAt: data.resultExpiresAt ?? null,
        progress: null,
      },
    });
  }

  async markFailed(jobId: string, errorMessage: string): Promise<void> {
    await this.prisma.accountTransferJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        finishedAt: new Date(),
        errorMessage,
        progress: null,
      },
    });
  }

  async deleteJob(userId: string, jobId: string): Promise<void> {
    const job = await this.getJob(userId, jobId);
    if (job.status === 'RUNNING') {
      throw new ConflictException('Cannot delete a running job');
    }
    if (job.resultStorageKey) {
      try {
        await this.storage.deleteObject(job.resultStorageKey);
      } catch (err) {
        this.logger.warn({
          message: 'Failed to delete result object',
          jobId,
          error: (err as Error).message,
        });
      }
    }
    if (job.inputStorageKey) {
      try {
        await this.storage.deleteObject(job.inputStorageKey);
      } catch (err) {
        this.logger.warn({
          message: 'Failed to delete input object',
          jobId,
          error: (err as Error).message,
        });
      }
    }
    await this.prisma.accountTransferJob.delete({ where: { id: jobId } });
  }
}
