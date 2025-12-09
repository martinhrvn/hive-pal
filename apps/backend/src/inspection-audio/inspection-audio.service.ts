import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { TranscriptionStatus } from '@prisma/client';

export interface UploadAudioDto {
  fileName: string;
  duration?: string; // Comes as string from form-data
}

export interface AudioResponse {
  id: string;
  inspectionId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  duration: number | null;
  transcriptionStatus: TranscriptionStatus;
  transcription: string | null;
  createdAt: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
  expiresIn: number;
}

const ALLOWED_MIME_TYPES = [
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/ogg',
  'audio/wav',
];

@Injectable()
export class InspectionAudioService {
  private maxFileSize: number;

  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private logger: CustomLoggerService,
    private configService: ConfigService,
  ) {
    this.maxFileSize =
      this.configService.get<number>('AUDIO_MAX_FILE_SIZE') || 52428800; // 50MB default
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
    // Verify storage is configured
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Audio recording is not available. Storage is not configured.',
      );
    }

    // Validate mime type
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid audio format. Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${Math.round(this.maxFileSize / 1024 / 1024)}MB)`,
      );
    }

    // Verify inspection exists and belongs to user's apiary
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        hive: {
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
          },
        },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${inspectionId} not found`,
      );
    }

    // Generate audio ID and storage key
    const audioId = uuidv4();
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const storageKey = `audio/${inspectionId}/${audioId}.${extension}`;

    // Upload to S3
    await this.storageService.uploadObject(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    // Parse duration if provided
    const duration = dto.duration ? parseFloat(dto.duration) : null;

    // Create audio record
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
    // Verify inspection exists and belongs to user
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        hive: {
          apiary: {
            id: filter.apiaryId,
            userId: filter.userId,
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
              userId: filter.userId,
            },
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    const expiresIn = 3600; // 1 hour
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
              userId: filter.userId,
            },
          },
        },
      },
    });

    if (!audio) {
      throw new NotFoundException(`Audio with ID ${audioId} not found`);
    }

    // Delete from storage
    if (this.storageService.isEnabled()) {
      try {
        await this.storageService.deleteObject(audio.storageKey);
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete audio from storage',
          audioId,
          storageKey: audio.storageKey,
          error,
        });
      }
    }

    // Delete from database
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

    // Delete from storage
    if (this.storageService.isEnabled() && audioRecordings.length > 0) {
      try {
        await this.storageService.deleteObjects(
          audioRecordings.map((a) => a.storageKey),
        );
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete audio files from storage',
          inspectionId,
          error,
        });
      }
    }

    // Database records will be deleted by cascade
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
      transcription: audio.transcription,
      createdAt: audio.createdAt.toISOString(),
    };
  }
}
