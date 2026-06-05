import type { AccountTransferJob as PrismaJob } from '../../generated/prisma/client.js';

export interface JobResponseDto {
  id: string;
  type: 'EXPORT' | 'IMPORT';
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  startedAt: Date | null;
  finishedAt: Date | null;
  progress: string | null;
  errorMessage: string | null;
  resultExpiresAt: Date | null;
  hasResult: boolean;
  summary: unknown;
}

export function toJobResponse(job: PrismaJob): JobResponseDto {
  return {
    id: job.id,
    type: job.type as 'EXPORT' | 'IMPORT',
    status: job.status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED',
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    progress: job.progress,
    errorMessage: job.errorMessage,
    resultExpiresAt: job.resultExpiresAt,
    hasResult:
      job.resultStorageKey !== null &&
      (job.resultExpiresAt === null || job.resultExpiresAt > new Date()),
    summary: job.summary,
  };
}
