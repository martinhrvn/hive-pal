import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { Prisma, TranscriptionStatus } from '@/prisma/client';

export interface UploadAudioDto {
  fileName: string;
  duration?: string; // Comes as string from form-data
}

interface AiProcessUploadResponse {
  status?: string;
  transcript?: {
    text?: string | null;
  };
  inspectionDraft?: Prisma.InputJsonValue | null;
  files?: {
    transcript_txt?: string;
    transcript_json?: string;
    recommendation_json?: string;
  };
}

interface AiRecommendResponse {
  [key: string]: unknown;
}

export interface AudioResponse {
  id: string;
  inspectionId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  duration: number | null;
  transcriptionStatus: TranscriptionStatus;
  analysisStatus: TranscriptionStatus;
  transcription: string | null;
  createdAt: string;
}

export interface ApiaryAudioListItem extends AudioResponse {
  inspectionDate: string;
  hiveId: string;
  hiveName: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresIn: number;
}

export interface AiAnalysisStatusResponse {
  id: string;
  transcriptionStatus: TranscriptionStatus;
  analysisStatus: TranscriptionStatus;
  analysisError: string | null;
  analysisCompletedAt: Date | null;
}

export interface AiAnalysisResultResponse {
  status: TranscriptionStatus;
  transcript: {
    text: string | null;
  };
  inspectionDraft: Prisma.JsonValue | null;
  error: string | null;
}

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
];

type AiProcessingMode = 'pull' | 'push' | 'auto';

@Injectable()
export class InspectionAudioService {
  private maxFileSize: number;
  private aiServiceBaseUrl: string;
  private aiApiKey: string;
  private aiProcessingMode: AiProcessingMode;
  private pullFallbackMinutes: number;

  private resolveBackendBaseUrl(): string {
    const backendPublicUrl =
      this.configService.get<string>('BACKEND_PUBLIC_URL');

    if (backendPublicUrl) {
      return backendPublicUrl.replace(/\/$/, '');
    }

    const port = this.configService.get<string>('PORT') ?? '3000';
    return `http://127.0.0.1:${port}`;
  }

  private resolveDownloadUrl(downloadUrl: string): string {
    if (/^https?:\/\//i.test(downloadUrl)) {
      return downloadUrl;
    }

    return new URL(downloadUrl, this.resolveBackendBaseUrl()).toString();
  }

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private logger: CustomLoggerService,
    private configService: ConfigService,
  ) {
    this.maxFileSize = Number(
      this.configService.get('INSPECTION_AUDIO_MAX_FILE_SIZE') ?? 10485760,
    );

    this.aiServiceBaseUrl =
      this.configService.get<string>('AI_SERVICE_BASE_URL') ??
      'http://hivepal-ai:8008';

    this.aiApiKey = this.configService.get<string>('AI_API_KEY') ?? '';

    const mode = (
      this.configService.get<string>('AI_PROCESSING_MODE') ?? 'push'
    ).toLowerCase();
    this.aiProcessingMode =
      mode === 'pull' || mode === 'auto' ? (mode as AiProcessingMode) : 'push';

    this.pullFallbackMinutes = Number(
      this.configService.get('AI_PULL_FALLBACK_MINUTES') ?? 10,
    );
  }

  private hasPushConfig(): boolean {
    return Boolean(this.aiServiceBaseUrl && this.aiApiKey);
  }

  /**
   * Upload an audio recording
   */
  async upload(
    inspectionId: string,
    file: Express.Multer.File,
    dto: UploadAudioDto,
    filter: ApiaryUserFilter,
  ): Promise<AudioResponse> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Audio recording is not available. Storage is not configured.',
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid audio format. Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`,
      );
    }

    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        hive: {
          apiary: {
            id: filter.apiaryId,
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${inspectionId} not found`,
      );
    }

    const audioId = uuidv4();
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const storageKey = `audio/${inspectionId}/${audioId}.${extension}`;

    await this.storageService.uploadObject(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    const duration = dto.duration ? parseFloat(dto.duration) : null;

    const audio = await this.prisma.inspectionAudio.create({
      data: {
        id: audioId,
        inspectionId,
        storageKey,
        fileName: dto.fileName,
        mimeType: file.mimetype,
        fileSize: file.size,
        duration,
      },
    });

    this.logger.log({
      message: 'Audio recording uploaded',
      audioId,
      inspectionId,
      fileName: dto.fileName,
      fileSize: file.size,
    });

    return this.mapToResponse(audio);
  }

  /**
   * List all audio recordings for an inspection
   */
  async findAll(
    inspectionId: string,
    filter: ApiaryUserFilter,
  ): Promise<AudioResponse[]> {
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        hive: {
          apiary: {
            id: filter.apiaryId,
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${inspectionId} not found`,
      );
    }

    const audioRecordings = await this.prisma.inspectionAudio.findMany({
      where: { inspectionId },
      orderBy: { createdAt: 'desc' },
    });

    return audioRecordings.map((audio) => this.mapToResponse(audio));
  }

  /**
   * List all audio recordings for an apiary, joined with inspection + hive info.
   */
  async findAllForApiary(
    filter: ApiaryUserFilter,
  ): Promise<ApiaryAudioListItem[]> {
    const records = await this.prisma.inspectionAudio.findMany({
      where: {
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
              userId: filter.userId,
            },
          },
        },
      },
      include: {
        inspection: {
          select: {
            id: true,
            date: true,
            hive: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      inspectionId: r.inspectionId,
      inspectionDate: r.inspection.date.toISOString(),
      hiveId: r.inspection.hive.id,
      hiveName: r.inspection.hive.name,
      fileName: r.fileName,
      mimeType: r.mimeType,
      fileSize: r.fileSize,
      duration: r.duration,
      transcriptionStatus: r.transcriptionStatus,
      analysisStatus: r.analysisStatus,
      transcription: r.transcription,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  /**
   * Start AI analysis for every audio in the apiary whose transcription is
   * NONE or FAILED. Reuses startAiAnalysis so push/pull/auto routing is shared.
   */
  async startAnalysisForPending(
    filter: ApiaryUserFilter,
  ): Promise<{ started: number }> {
    const pending = await this.prisma.inspectionAudio.findMany({
      where: {
        transcriptionStatus: { in: ['NONE', 'FAILED'] },
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
              userId: filter.userId,
            },
          },
        },
      },
      select: { id: true, inspectionId: true },
    });

    let started = 0;
    for (const audio of pending) {
      try {
        await this.startAiAnalysis(audio.inspectionId, audio.id, filter);
        started++;
      } catch (err) {
        this.logger.warn({
          message: 'Failed to start AI analysis for audio in bulk',
          audioId: audio.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return { started };
  }

  /**
   * Get a pre-signed download URL for an audio recording
   */
  async getDownloadUrl(
    inspectionId: string,
    audioId: string,
    filter: ApiaryUserFilter,
  ): Promise<DownloadUrlResponse> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Audio recording is not available. Storage is not configured.',
      );
    }

    const audio = await this.prisma.inspectionAudio.findFirst({
      where: {
        id: audioId,
        inspectionId,
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
            },
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    const expiresIn = 3600;
    const downloadUrl = await this.storageService.generateDownloadUrl(
      audio.storageKey,
      expiresIn,
    );

    return { downloadUrl, expiresIn };
  }

  /**
   * Delete an audio recording
   */
  async delete(
    inspectionId: string,
    audioId: string,
    filter: ApiaryUserFilter,
  ): Promise<void> {
    const audio = await this.prisma.inspectionAudio.findFirst({
      where: {
        id: audioId,
        inspectionId,
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
            },
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    if (this.storageService.isEnabled()) {
      try {
        await this.storageService.deleteObject(audio.storageKey);
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete audio from storage',
          audioId,
          storageKey: audio.storageKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.prisma.inspectionAudio.delete({
      where: { id: audioId },
    });

    this.logger.log({
      message: 'Audio recording deleted',
      audioId,
      inspectionId,
    });
  }

  /**
   * Delete all audio recordings for an inspection (used when deleting inspection)
   */
  async deleteAllForInspection(inspectionId: string): Promise<void> {
    const audioRecordings = await this.prisma.inspectionAudio.findMany({
      where: { inspectionId },
      select: { storageKey: true },
    });

    if (this.storageService.isEnabled() && audioRecordings.length > 0) {
      try {
        await this.storageService.deleteObjects(
          audioRecordings.map((a) => a.storageKey),
        );
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete audio files from storage',
          inspectionId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  async startAiAnalysis(
    inspectionId: string,
    audioId: string,
    filter: ApiaryUserFilter,
  ): Promise<{ status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' }> {
    const audio = await this.prisma.inspectionAudio.findFirst({
      where: {
        id: audioId,
        inspectionId,
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
              userId: filter.userId,
            },
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    await this.prisma.inspectionAudio.update({
      where: { id: audioId },
      data: {
        transcription: null,
        transcriptionStatus: 'PENDING',
        transcriptionError: null,
        transcriptionRetries: 0,
        transcriptionClaimedAt: null,
        transcriptionLeaseUntil: null,
        transcriptionWorkerTokenId: null,
        analysisStatus: 'NONE',
        analysisResult: Prisma.JsonNull,
        analysisError: null,
        analysisCompletedAt: null,
        analysisRetries: 0,
        analysisClaimedAt: null,
        analysisLeaseUntil: null,
        analysisWorkerTokenId: null,
      },
    });

    if (this.aiProcessingMode === 'push') {
      if (!this.hasPushConfig()) {
        this.logger.warn({
          message:
            'AI_PROCESSING_MODE=push but AI service not configured; leaving job PENDING',
          audioId,
        });
      } else {
        void this.runAiAnalysisInBackground(audioId, audio.storageKey);
      }
    }
    // pull / auto: leave job PENDING for a worker. Auto mode falls back via
    // scheduled job (`runPullFallbackSweep`) after AI_PULL_FALLBACK_MINUTES.

    return { status: 'PENDING' };
  }

  async updateTranscriptionAndReanalyze(
    inspectionId: string,
    audioId: string,
    text: string,
    filter: ApiaryUserFilter,
  ): Promise<{ status: 'PENDING' }> {
    const audio = await this.prisma.inspectionAudio.findFirst({
      where: {
        id: audioId,
        inspectionId,
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
              userId: filter.userId,
            },
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    if (audio.transcriptionStatus !== 'COMPLETED') {
      throw new BadRequestException(
        'Transcription must be COMPLETED before it can be edited',
      );
    }

    if (
      audio.analysisStatus === 'PENDING' ||
      audio.analysisStatus === 'PROCESSING'
    ) {
      throw new BadRequestException(
        'Analysis is already in progress for this recording',
      );
    }

    const trimmed = text.trim();
    if (!trimmed) {
      throw new BadRequestException('Transcription must not be empty');
    }

    await this.prisma.inspectionAudio.update({
      where: { id: audioId },
      data: {
        transcription: trimmed,
        analysisStatus: 'PENDING',
        analysisResult: Prisma.JsonNull,
        analysisError: null,
        analysisCompletedAt: null,
        analysisRetries: 0,
        analysisClaimedAt: null,
        analysisLeaseUntil: null,
        analysisWorkerTokenId: null,
      },
    });

    if (this.aiProcessingMode === 'push') {
      if (!this.hasPushConfig()) {
        this.logger.warn({
          message:
            'AI_PROCESSING_MODE=push but AI service not configured; leaving analysis PENDING',
          audioId,
        });
      } else {
        void this.runAnalysisOnlyInBackground(audioId, trimmed);
      }
    }
    // pull / auto: leave PENDING for a worker to claim via claimAnalysis.

    this.logger.log({
      message: 'Transcription edited and analysis re-queued',
      audioId,
      length: trimmed.length,
    });

    return { status: 'PENDING' };
  }

  private async runAnalysisOnlyInBackground(
    audioId: string,
    transcript: string,
  ): Promise<void> {
    try {
      await this.prisma.inspectionAudio.update({
        where: { id: audioId },
        data: { analysisStatus: 'PROCESSING' },
      });

      const response = await fetch(`${this.aiServiceBaseUrl}/recommend`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.aiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const rawResult: unknown = await response.json();
      const result = rawResult as AiRecommendResponse;

      await this.prisma.inspectionAudio.update({
        where: { id: audioId },
        data: {
          analysisStatus: 'COMPLETED',
          analysisResult: result as Prisma.InputJsonValue,
          analysisError: null,
          analysisCompletedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.inspectionAudio.update({
        where: { id: audioId },
        data: {
          analysisStatus: 'FAILED',
          analysisError: message,
        },
      });

      this.logger.error({
        message: 'Analysis-only re-run failed',
        audioId,
        error: message,
      });
    }
  }

  /**
   * For mode=auto: find audios that have been waiting too long for a worker
   * and process them via the push path instead.
   */
  async runPullFallbackSweep(): Promise<void> {
    if (this.aiProcessingMode !== 'auto') return;
    if (!this.hasPushConfig()) return;

    const cutoff = new Date(Date.now() - this.pullFallbackMinutes * 60 * 1000);
    const stuck = await this.prisma.inspectionAudio.findMany({
      where: {
        transcriptionStatus: 'PENDING',
        analysisStatus: 'NONE',
        createdAt: { lt: cutoff },
      },
      select: { id: true, storageKey: true },
      take: 5,
    });

    for (const audio of stuck) {
      this.logger.log({
        message: 'Pull job timed out; falling back to push',
        audioId: audio.id,
      });
      void this.runAiAnalysisInBackground(audio.id, audio.storageKey);
    }
  }

  private async runAiAnalysisInBackground(
    audioId: string,
    storageKey: string,
  ): Promise<void> {
    try {
      await this.prisma.inspectionAudio.update({
        where: { id: audioId },
        data: { transcriptionStatus: 'PROCESSING' },
      });

      const downloadUrl = await this.storageService.generateDownloadUrl(
        storageKey,
        3600,
      );
      const resolvedDownloadUrl = this.resolveDownloadUrl(downloadUrl);
      const audioResponse = await fetch(resolvedDownloadUrl);

      if (!audioResponse.ok) {
        throw new Error(
          `Failed to download audio file: ${audioResponse.status}`,
        );
      }

      const fileArrayBuffer = await audioResponse.arrayBuffer();

      const formData = new FormData();
      const fileBlob = new Blob([fileArrayBuffer], { type: 'audio/webm' });
      formData.append('file', fileBlob, 'audio.webm');

      const response = await fetch(`${this.aiServiceBaseUrl}/process-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.aiApiKey}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI service returned ${response.status}`);
      }

      const rawResult: unknown = await response.json();
      const result = rawResult as AiProcessUploadResponse;

      await this.prisma.inspectionAudio.update({
        where: { id: audioId },
        data: {
          transcription: result.transcript?.text ?? null,
          transcriptionStatus: 'COMPLETED',
          transcriptionError: null,
          analysisStatus: 'COMPLETED',
          analysisResult: result.inspectionDraft ?? Prisma.JsonNull,
          analysisError: null,
          analysisCompletedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.inspectionAudio.update({
        where: { id: audioId },
        data: {
          transcriptionStatus: 'FAILED',
          transcriptionError: message,
          analysisStatus: 'FAILED',
          analysisError: message,
        },
      });

      this.logger.error({
        message: 'AI analysis failed',
        audioId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async getAiAnalysisStatus(
    inspectionId: string,
    audioId: string,
    filter: ApiaryUserFilter,
  ): Promise<AiAnalysisStatusResponse> {
    const audio = await this.prisma.inspectionAudio.findFirst({
      where: {
        id: audioId,
        inspectionId,
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
              userId: filter.userId,
            },
          },
        },
      },
      select: {
        id: true,
        transcriptionStatus: true,
        analysisStatus: true,
        analysisError: true,
        analysisCompletedAt: true,
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    return audio;
  }

  async getAiAnalysisResult(
    inspectionId: string,
    audioId: string,
    filter: ApiaryUserFilter,
  ): Promise<AiAnalysisResultResponse> {
    const audio = await this.prisma.inspectionAudio.findFirst({
      where: {
        id: audioId,
        inspectionId,
        inspection: {
          hive: {
            apiary: {
              id: filter.apiaryId,
              userId: filter.userId,
            },
          },
        },
      },
      select: {
        transcriptionStatus: true,
        analysisStatus: true,
        transcription: true,
        analysisResult: true,
        analysisError: true,
        transcriptionError: true,
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    // Report the overall pipeline status: COMPLETED only when both stages done;
    // FAILED if either failed; otherwise reflect the in-progress stage.
    let status: TranscriptionStatus = audio.transcriptionStatus;
    if (
      audio.transcriptionStatus === 'COMPLETED' &&
      audio.analysisStatus !== 'NONE'
    ) {
      status = audio.analysisStatus;
    }

    return {
      status,
      transcript: {
        text: audio.transcription,
      },
      inspectionDraft: audio.analysisResult,
      error: audio.analysisError ?? audio.transcriptionError,
    };
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'audio/webm': 'webm',
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
    };

    return mimeToExt[mimeType] || 'webm';
  }

  private mapToResponse(
    audio: Awaited<ReturnType<typeof this.prisma.inspectionAudio.findFirst>>,
  ): AudioResponse {
    if (!audio) {
      throw new Error('Audio record not found');
    }

    return {
      id: audio.id,
      inspectionId: audio.inspectionId,
      fileName: audio.fileName,
      mimeType: audio.mimeType,
      fileSize: audio.fileSize,
      duration: audio.duration,
      transcriptionStatus: audio.transcriptionStatus,
      analysisStatus: audio.analysisStatus,
      transcription: audio.transcription,
      createdAt: audio.createdAt.toISOString(),
    };
  }
}
