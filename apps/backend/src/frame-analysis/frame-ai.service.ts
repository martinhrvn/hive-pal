import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
import FormData from 'form-data';
import {
  frameAnalysisResultSchema,
  FrameAnalysisResponse,
} from 'shared-schemas';
import { Prisma } from '@/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';

const DOWNLOAD_TTL_SECONDS = 900;

@Injectable()
export class FrameAiService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('FrameAiService');
  }

  /** Send a stored photo to the DeepBee container, persist and return the stats. */
  async analyze(
    photoId: string,
    filter: ApiaryUserFilter,
  ): Promise<FrameAnalysisResponse> {
    if (this.config.get<string>('FRAME_AI_ENABLED') !== 'true') {
      throw new BadRequestException('Frame analysis is disabled');
    }

    const photo = await this.requirePhoto(photoId, filter);

    const downloadUrl = await this.storage.generateDownloadUrl(
      photo.storageKey,
      DOWNLOAD_TTL_SECONDS,
    );
    const imageResponse = await axios.get<ArrayBuffer>(downloadUrl, {
      responseType: 'arraybuffer',
    });

    const form = new FormData();
    form.append('file', Buffer.from(imageResponse.data), {
      filename: photo.fileName,
      contentType: photo.mimeType,
    });

    const url = `${this.config.get<string>('FRAME_AI_SERVICE_URL')}/classify-frame`;

    this.logger.log({ message: 'Requesting frame analysis', photoId });

    const result = await firstValueFrom(
      this.http.post<unknown>(url, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.config.get<string>('FRAME_AI_API_KEY')}`,
        },
        timeout: Number(this.config.get('FRAME_AI_TIMEOUT_MS') || 120000),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }),
    );

    const parsed = frameAnalysisResultSchema.parse(result.data);

    const saved = await this.prisma.frameAnalysis.upsert({
      where: { photoId },
      create: {
        photoId,
        result: parsed as unknown as Prisma.InputJsonValue,
        modelVersion: parsed.modelVersion,
      },
      update: {
        result: parsed as unknown as Prisma.InputJsonValue,
        modelVersion: parsed.modelVersion,
        createdAt: new Date(),
      },
    });

    this.logger.log({
      message: 'Frame analysis complete',
      photoId,
      totalCells: parsed.totalCells,
    });

    return { ...parsed, photoId, analyzedAt: saved.createdAt.toISOString() };
  }

  /** Return a previously stored analysis for a photo, or null if none exists. */
  async getAnalysis(
    photoId: string,
    filter: ApiaryUserFilter,
  ): Promise<FrameAnalysisResponse | null> {
    await this.requirePhoto(photoId, filter);

    const existing = await this.prisma.frameAnalysis.findUnique({
      where: { photoId },
    });
    if (!existing) {
      return null;
    }

    const parsed = frameAnalysisResultSchema.parse(existing.result);
    return { ...parsed, photoId, analyzedAt: existing.createdAt.toISOString() };
  }

  private async requirePhoto(photoId: string, filter: ApiaryUserFilter) {
    const photo = await this.prisma.photo.findFirst({
      where: { id: photoId, apiaryId: filter.apiaryId },
    });
    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }
    return photo;
  }
}
