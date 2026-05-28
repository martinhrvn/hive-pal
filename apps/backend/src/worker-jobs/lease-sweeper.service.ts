import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

const MAX_RETRIES = 3;

@Injectable()
export class LeaseSweeperService {
  private readonly logger = new Logger(LeaseSweeperService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async sweepExpiredLeases(): Promise<void> {
    const now = new Date();

    const expiredTranscriptions = await this.prisma.inspectionAudio.findMany({
      where: {
        transcriptionStatus: 'PROCESSING',
        transcriptionLeaseUntil: { lt: now },
      },
      select: { id: true, transcriptionRetries: true },
    });

    for (const audio of expiredTranscriptions) {
      const retries = audio.transcriptionRetries + 1;
      const failed = retries >= MAX_RETRIES;
      await this.prisma.inspectionAudio.update({
        where: { id: audio.id },
        data: {
          transcriptionStatus: failed ? 'FAILED' : 'PENDING',
          transcriptionError: failed
            ? 'Worker lease expired without completion'
            : null,
          transcriptionRetries: retries,
          transcriptionClaimedAt: null,
          transcriptionLeaseUntil: null,
          transcriptionWorkerTokenId: null,
        },
      });
      this.logger.warn(
        `Transcription lease expired for audio ${audio.id} (retry ${retries}${failed ? ', giving up' : ''})`,
      );
    }

    const expiredAnalyses = await this.prisma.inspectionAudio.findMany({
      where: {
        analysisStatus: 'PROCESSING',
        analysisLeaseUntil: { lt: now },
      },
      select: { id: true, analysisRetries: true },
    });

    for (const audio of expiredAnalyses) {
      const retries = audio.analysisRetries + 1;
      const failed = retries >= MAX_RETRIES;
      await this.prisma.inspectionAudio.update({
        where: { id: audio.id },
        data: {
          analysisStatus: failed ? 'FAILED' : 'PENDING',
          analysisError: failed
            ? 'Worker lease expired without completion'
            : null,
          analysisRetries: retries,
          analysisClaimedAt: null,
          analysisLeaseUntil: null,
          analysisWorkerTokenId: null,
        },
      });
      this.logger.warn(
        `Analysis lease expired for audio ${audio.id} (retry ${retries}${failed ? ', giving up' : ''})`,
      );
    }
  }
}
