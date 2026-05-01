import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import axios from 'axios';
const FormData = require('form-data');
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.interface';

export interface AiTranscript {
  text: string;
  language?: string;
  segments?: unknown[];
  [key: string]: unknown;
}

export interface AiInspectionDraft {
  [key: string]: unknown;
}

export interface AiProcessUploadResponse {
  status: string;
  transcript: AiTranscript;
  inspectionDraft: AiInspectionDraft;
  files?: Record<string, string>;
}

@Injectable()
export class AiService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async analyzeInspectionAudio(
    inspectionId: string,
    audioId: string,
  ): Promise<AiProcessUploadResponse> {
    const enabled = this.config.get<string>('AI_ENABLED') === 'true';
    if (!enabled) {
      throw new BadRequestException('AI is disabled');
    }

    const audio = await this.prisma.inspectionAudio.findFirst({
      where: { id: audioId, inspectionId },
    });

    if (!audio) {
      throw new NotFoundException('Audio not found');
    }

    const downloadUrl = await this.storage.generateDownloadUrl(
      audio.storageKey,
      900,
    );

    const audioResponse = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
    });

    const form = new FormData();
    form.append('file', Buffer.from(audioResponse.data), {
      filename: audio.fileName,
      contentType: audio.mimeType,
    });

    const aiUrl = `${this.config.get<string>('AI_SERVICE_URL')}/process-upload`;

    const result = await firstValueFrom(
      this.http.post<AiProcessUploadResponse>(aiUrl, form, {
        headers: {
          ...form.getHeaders(),
          Authorization: `Bearer ${this.config.get<string>('AI_SERVICE_API_KEY')}`,
        },
        timeout: Number(this.config.get('AI_REQUEST_TIMEOUT_MS') || 300000),
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      }),
    );

    const aiResponse: AiProcessUploadResponse = result.data;

    await this.prisma.inspectionAudio.update({
      where: { id: audio.id },
      data: {
        transcriptionStatus: 'COMPLETED',
        transcription: aiResponse.transcript.text,
      },
    });

    return aiResponse;
  }
}