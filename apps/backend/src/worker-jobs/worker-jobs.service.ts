import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { sanitizeAiInspectionDraft } from '../utils/ai-inspection-draft';

const DEFAULT_LEASE_MS = 5 * 60 * 1000; // 5 minutes
const SIGNED_URL_TTL_SECONDS = 600; // 10 minutes
const MAX_RETRIES = 3;

export interface TranscriptionJob {
  audioId: string;
  inspectionId: string;
  mimeType: string;
  downloadUrl: string;
  leaseUntil: Date;
}

export interface AnalysisJob {
  audioId: string;
  inspectionId: string;
  transcription: string;
  leaseUntil: Date;
}

@Injectable()
export class WorkerJobsService {
  private readonly leaseMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly logger: CustomLoggerService,
    private readonly configService: ConfigService,
  ) {
    this.leaseMs = Number(
      this.configService.get('WORKER_JOB_LEASE_MS') ?? DEFAULT_LEASE_MS,
    );
  }

  async claimTranscription(
    workerTokenId: string,
  ): Promise<TranscriptionJob | null> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + this.leaseMs);

    const claimed = await this.prisma.$transaction(async (tx) => {
      const candidate = await tx.inspectionAudio.findFirst({
        where: {
          transcriptionStatus: 'PENDING',
          OR: [
            { transcriptionLeaseUntil: null },
            { transcriptionLeaseUntil: { lt: now } },
          ],
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          inspectionId: true,
          storageKey: true,
          mimeType: true,
        },
      });

      if (!candidate) return null;

      const update = await tx.inspectionAudio.updateMany({
        where: {
          id: candidate.id,
          transcriptionStatus: 'PENDING',
        },
        data: {
          transcriptionStatus: 'PROCESSING',
          transcriptionClaimedAt: now,
          transcriptionLeaseUntil: leaseUntil,
          transcriptionWorkerTokenId: workerTokenId,
        },
      });

      if (update.count === 0) return null;
      return candidate;
    });

    if (!claimed) return null;

    const downloadUrl = await this.storageService.generateDownloadUrl(
      claimed.storageKey,
      SIGNED_URL_TTL_SECONDS,
    );

    return {
      audioId: claimed.id,
      inspectionId: claimed.inspectionId,
      mimeType: claimed.mimeType,
      downloadUrl,
      leaseUntil,
    };
  }

  async completeTranscription(
    audioId: string,
    workerTokenId: string,
    text: string,
    duration?: number,
  ): Promise<void> {
    const audio = await this.prisma.inspectionAudio.findUnique({
      where: { id: audioId },
      select: {
        transcriptionStatus: true,
        transcriptionWorkerTokenId: true,
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio ${audioId} not found`);
    }
    if (audio.transcriptionStatus !== 'PROCESSING') {
      throw new BadRequestException(
        `Audio ${audioId} is not in PROCESSING state`,
      );
    }
    if (audio.transcriptionWorkerTokenId !== workerTokenId) {
      throw new BadRequestException(
        `Audio ${audioId} is claimed by a different worker`,
      );
    }

    await this.prisma.inspectionAudio.update({
      where: { id: audioId },
      data: {
        transcription: text,
        transcriptionStatus: 'COMPLETED',
        transcriptionError: null,
        transcriptionClaimedAt: null,
        transcriptionLeaseUntil: null,
        transcriptionWorkerTokenId: null,
        duration: duration ?? undefined,
        analysisStatus: 'PENDING',
        analysisError: null,
      },
    });

    this.logger.log({
      message: 'Worker completed transcription',
      audioId,
      workerTokenId,
      length: text.length,
    });
  }

  async failTranscription(
    audioId: string,
    workerTokenId: string,
    error: string,
  ): Promise<void> {
    const audio = await this.prisma.inspectionAudio.findUnique({
      where: { id: audioId },
      select: {
        transcriptionStatus: true,
        transcriptionWorkerTokenId: true,
        transcriptionRetries: true,
      },
    });
    if (!audio) {
      throw new NotFoundException(`Audio ${audioId} not found`);
    }
    if (audio.transcriptionWorkerTokenId !== workerTokenId) {
      throw new BadRequestException(
        `Audio ${audioId} is claimed by a different worker`,
      );
    }

    const retries = audio.transcriptionRetries + 1;
    const failed = retries >= MAX_RETRIES;

    await this.prisma.inspectionAudio.update({
      where: { id: audioId },
      data: {
        transcriptionStatus: failed ? 'FAILED' : 'PENDING',
        transcriptionError: error,
        transcriptionRetries: retries,
        transcriptionClaimedAt: null,
        transcriptionLeaseUntil: null,
        transcriptionWorkerTokenId: null,
      },
    });

    this.logger.warn({
      message: 'Worker reported transcription failure',
      audioId,
      workerTokenId,
      retries,
      failed,
      error,
    });
  }

  async claimAnalysis(workerTokenId: string): Promise<AnalysisJob | null> {
    const now = new Date();
    const leaseUntil = new Date(now.getTime() + this.leaseMs);

    return this.prisma.$transaction(async (tx) => {
      const candidate = await tx.inspectionAudio.findFirst({
        where: {
          analysisStatus: 'PENDING',
          transcription: { not: null },
          OR: [
            { analysisLeaseUntil: null },
            { analysisLeaseUntil: { lt: now } },
          ],
        },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          inspectionId: true,
          transcription: true,
        },
      });

      if (!candidate || !candidate.transcription) return null;

      const update = await tx.inspectionAudio.updateMany({
        where: {
          id: candidate.id,
          analysisStatus: 'PENDING',
        },
        data: {
          analysisStatus: 'PROCESSING',
          analysisClaimedAt: now,
          analysisLeaseUntil: leaseUntil,
          analysisWorkerTokenId: workerTokenId,
        },
      });
      if (update.count === 0) return null;

      return {
        audioId: candidate.id,
        inspectionId: candidate.inspectionId,
        transcription: candidate.transcription,
        leaseUntil,
      };
    });
  }

  async completeAnalysis(
    audioId: string,
    workerTokenId: string,
    inspectionDraft: Record<string, unknown>,
  ): Promise<void> {
    const audio = await this.prisma.inspectionAudio.findUnique({
      where: { id: audioId },
      select: {
        analysisStatus: true,
        analysisWorkerTokenId: true,
      },
    });
    if (!audio) {
      throw new NotFoundException(`Audio ${audioId} not found`);
    }
    if (audio.analysisStatus !== 'PROCESSING') {
      throw new BadRequestException(
        `Audio ${audioId} is not in analysis PROCESSING state`,
      );
    }
    if (audio.analysisWorkerTokenId !== workerTokenId) {
      throw new BadRequestException(
        `Audio ${audioId} is claimed by a different worker`,
      );
    }

    const sanitizedDraft = sanitizeAiInspectionDraft(inspectionDraft);
    if (!sanitizedDraft) {
      throw new BadRequestException(
        'inspectionDraft does not match the AI inspection draft schema',
      );
    }

    await this.prisma.inspectionAudio.update({
      where: { id: audioId },
      data: {
        analysisResult: sanitizedDraft as Prisma.InputJsonValue,
        analysisStatus: 'COMPLETED',
        analysisError: null,
        analysisCompletedAt: new Date(),
        analysisClaimedAt: null,
        analysisLeaseUntil: null,
        analysisWorkerTokenId: null,
      },
    });

    this.logger.log({
      message: 'Worker completed analysis',
      audioId,
      workerTokenId,
    });
  }

  async failAnalysis(
    audioId: string,
    workerTokenId: string,
    error: string,
  ): Promise<void> {
    const audio = await this.prisma.inspectionAudio.findUnique({
      where: { id: audioId },
      select: {
        analysisStatus: true,
        analysisWorkerTokenId: true,
        analysisRetries: true,
      },
    });
    if (!audio) {
      throw new NotFoundException(`Audio ${audioId} not found`);
    }
    if (audio.analysisWorkerTokenId !== workerTokenId) {
      throw new BadRequestException(
        `Audio ${audioId} is claimed by a different worker`,
      );
    }

    const retries = audio.analysisRetries + 1;
    const failed = retries >= MAX_RETRIES;

    await this.prisma.inspectionAudio.update({
      where: { id: audioId },
      data: {
        analysisStatus: failed ? 'FAILED' : 'PENDING',
        analysisError: error,
        analysisRetries: retries,
        analysisClaimedAt: null,
        analysisLeaseUntil: null,
        analysisWorkerTokenId: null,
      },
    });

    this.logger.warn({
      message: 'Worker reported analysis failure',
      audioId,
      workerTokenId,
      retries,
      failed,
      error,
    });
  }

  async getStatusSummary() {
    const onlineWindow = new Date(Date.now() - 2 * 60 * 1000);
    const [workersOnline, mostRecent] = await Promise.all([
      this.prisma.workerToken.count({
        where: {
          revokedAt: null,
          lastSeenAt: { gte: onlineWindow },
        },
      }),
      this.prisma.workerToken.findFirst({
        where: { revokedAt: null, lastSeenAt: { not: null } },
        orderBy: { lastSeenAt: 'desc' },
        select: { lastSeenAt: true },
      }),
    ]);

    return {
      workersOnline,
      lastSeen: mostRecent?.lastSeenAt ?? null,
    };
  }
}
