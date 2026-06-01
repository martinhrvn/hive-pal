import { BadRequestException, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import type { Readable } from 'stream';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Relay to the external AI service `/chat` endpoint. Mirrors ai.service.ts:
 * AI_ENABLED gating, Bearer auth and timeout handling. The difference is that
 * this posts `{ model, messages, stream: true }` and returns the raw NDJSON
 * stream so the caller can pipe chunks through to the browser as SSE.
 */
@Injectable()
export class AssistantAiService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  isEnabled(): boolean {
    return this.config.get<string>('AI_ENABLED') === 'true';
  }

  assertEnabled(): void {
    if (!this.isEnabled()) {
      throw new BadRequestException('AI is disabled');
    }
  }

  async streamChat(messages: ChatMessage[]): Promise<Readable> {
    this.assertEnabled();

    // Match the env vars the existing transcription service uses
    // (AI_SERVICE_BASE_URL / AI_API_KEY), falling back to the older names
    // (AI_SERVICE_URL / AI_SERVICE_API_KEY) and finally the compose default.
    const aiServiceUrl =
      this.config.get<string>('AI_SERVICE_BASE_URL') ??
      this.config.get<string>('AI_SERVICE_URL') ??
      'http://hivepal-ai:8008';
    const apiKey =
      this.config.get<string>('AI_API_KEY') ??
      this.config.get<string>('AI_SERVICE_API_KEY') ??
      '';

    if (!aiServiceUrl) {
      throw new BadRequestException(
        'AI service URL is not configured. Set AI_SERVICE_BASE_URL to the URL of the AI service (e.g. http://hivepal-ai:8008).',
      );
    }
    const aiUrl = `${aiServiceUrl}/chat`;
    const model = this.config.get<string>('OLLAMA_MODEL');

    const response = await firstValueFrom(
      this.http.post(
        aiUrl,
        { messages, ...(model ? { model } : {}) },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          timeout: Number(this.config.get('AI_REQUEST_TIMEOUT_MS') || 300000),
          responseType: 'stream',
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
        },
      ),
    );

    return response.data as Readable;
  }
}
