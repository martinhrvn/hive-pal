import { Injectable, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import type { Readable } from 'stream';
import {
  AssistantMessageResponse,
  AssistantSuggestions,
  assistantSuggestionsSchema,
  AssistantThreadResponse,
  AssistantThreadWithMessagesResponse,
  CreateAssistantThread,
} from 'shared-schemas';
import {
  AssistantMessage,
  AssistantRole,
  AssistantThread,
} from '@/prisma/client';
import { CustomLoggerService } from '../logger/logger.service';
import { AssistantRepository } from './assistant.repository';
import { ContextBuilderService } from './context-builder.service';
import { AssistantAiService, ChatMessage } from './assistant-ai.service';

@Injectable()
export class AssistantService {
  constructor(
    private readonly repository: AssistantRepository,
    private readonly contextBuilder: ContextBuilderService,
    private readonly ai: AssistantAiService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('AssistantService');
  }

  async createThread(
    dto: CreateAssistantThread,
    apiaryId: string,
  ): Promise<AssistantThreadResponse> {
    this.ai.assertEnabled();

    if (dto.hiveId) {
      const belongs = await this.repository.hiveInApiary(dto.hiveId, apiaryId);
      if (!belongs) {
        throw new NotFoundException(
          'Hive not found or does not belong to this apiary',
        );
      }
    }

    const title = dto.hiveId
      ? `Hive chat ${this.today()}`
      : `Apiary advisor ${this.today()}`;

    const thread = await this.repository.createThread({
      apiaryId,
      hiveId: dto.hiveId ?? null,
      title,
    });
    return this.mapThread(thread);
  }

  async listThreads(
    apiaryId: string,
    hiveId?: string,
  ): Promise<AssistantThreadResponse[]> {
    const threads = await this.repository.listThreads(apiaryId, hiveId ?? null);
    return threads.map((t) => this.mapThread(t));
  }

  async getThread(
    id: string,
    apiaryId: string,
  ): Promise<AssistantThreadWithMessagesResponse> {
    const thread = await this.repository.findThreadWithMessages(id, apiaryId);
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }
    return {
      ...this.mapThread(thread),
      messages: thread.messages.map((m) => this.mapMessage(m)),
    };
  }

  async deleteThread(id: string, apiaryId: string): Promise<void> {
    const deleted = await this.repository.deleteThread(id, apiaryId);
    if (!deleted) {
      throw new NotFoundException('Thread not found');
    }
  }

  /**
   * Persist the user message, rebuild fresh context, call the AI service and
   * stream the assistant reply back to the browser as SSE. Persist the full
   * assistant message once the stream completes.
   */
  async streamMessage(
    threadId: string,
    apiaryId: string,
    userId: string,
    content: string,
    res: Response,
  ): Promise<void> {
    this.ai.assertEnabled();

    const thread = await this.repository.findThread(threadId, apiaryId);
    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    // Persist the user's turn first.
    await this.repository.addMessage({
      threadId,
      role: AssistantRole.USER,
      content,
    });

    // Freshly built system context (the LLM is stateless — no model memory).
    const systemContent = await this.contextBuilder.buildSystemMessage(
      thread.hiveId
        ? { kind: 'hive', apiaryId, hiveId: thread.hiveId, userId }
        : { kind: 'apiary', apiaryId, userId },
    );

    // History = persisted USER/ASSISTANT turns (SYSTEM is re-injected fresh).
    const full = await this.repository.findThreadWithMessages(
      threadId,
      apiaryId,
    );
    const history: ChatMessage[] = (full?.messages ?? [])
      .filter((m) => m.role !== AssistantRole.SYSTEM)
      .map((m) => ({
        role: m.role === AssistantRole.ASSISTANT ? 'assistant' : 'user',
        content: m.content,
      }));

    const messages: ChatMessage[] = [
      { role: 'system', content: systemContent },
      ...history,
    ];

    this.prepareSse(res);

    let stream: Readable;
    try {
      stream = await this.ai.streamChat(messages);
    } catch (err) {
      this.logger.error(
        `Failed to start assistant stream: ${(err as Error).message}`,
      );
      this.writeSse(res, {
        type: 'error',
        message: 'Failed to reach AI service',
      });
      res.end();
      return;
    }

    let assistantText = '';
    let buffer = '';

    const flushLine = (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const chunk = JSON.parse(trimmed) as {
          message?: { content?: string };
          done?: boolean;
        };
        const token = chunk.message?.content ?? '';
        if (token) {
          assistantText += token;
          this.writeSse(res, { type: 'token', content: token });
        }
      } catch {
        // Ignore non-JSON keepalive lines.
      }
    };

    await new Promise<void>((resolve) => {
      stream.on('data', (data: Buffer) => {
        buffer += data.toString('utf-8');
        let idx: number;
        while ((idx = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          flushLine(line);
        }
      });
      stream.on('end', () => {
        if (buffer) flushLine(buffer);
        resolve();
      });
      stream.on('error', (err: Error) => {
        this.logger.error(`Assistant stream error: ${err.message}`);
        this.writeSse(res, { type: 'error', message: 'Stream interrupted' });
        resolve();
      });
    });

    const suggestions = this.parseSuggestions(assistantText);

    const saved = await this.repository.addMessage({
      threadId,
      role: AssistantRole.ASSISTANT,
      content: assistantText,
      suggestions,
    });

    this.writeSse(res, { type: 'done', message: this.mapMessage(saved) });
    res.end();
  }

  // -- helpers --------------------------------------------------------------

  private prepareSse(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();
  }

  private writeSse(res: Response, payload: unknown): void {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  /**
   * Extract the structured suggestion block (a fenced ```json array) the
   * assistant may emit (phase 6). Returns null when absent or invalid.
   */
  parseSuggestions(content: string): AssistantSuggestions | null {
    if (!content) return null;
    // Avoid overlapping quantifiers (\s* followed by [\s\S]*?) which can cause
    // super-linear backtracking; capture the body lazily and trim later.
    const fence = /```json([\s\S]*?)```/gi;
    let match: RegExpExecArray | null;
    let lastBlock: string | null = null;
    while ((match = fence.exec(content)) !== null) {
      lastBlock = match[1];
    }
    if (!lastBlock) return null;

    try {
      const parsed: unknown = JSON.parse(lastBlock.trim());
      // Accept either a bare array or an object with a `suggestions` array.
      const candidate =
        Array.isArray(parsed) ||
        (parsed as { suggestions?: unknown }).suggestions === undefined
          ? parsed
          : (parsed as { suggestions: unknown }).suggestions;
      const result = assistantSuggestionsSchema.safeParse(candidate);
      return result.success && result.data.length > 0 ? result.data : null;
    } catch {
      return null;
    }
  }

  private mapThread(thread: AssistantThread): AssistantThreadResponse {
    return {
      id: thread.id,
      apiaryId: thread.apiaryId,
      hiveId: thread.hiveId,
      title: thread.title,
      createdAt: thread.createdAt.toISOString(),
      updatedAt: thread.updatedAt.toISOString(),
    };
  }

  private mapMessage(message: AssistantMessage): AssistantMessageResponse {
    let suggestions: AssistantSuggestions | null = null;
    if (message.suggestions != null) {
      const result = assistantSuggestionsSchema.safeParse(message.suggestions);
      if (result.success) suggestions = result.data;
    }
    return {
      id: message.id,
      threadId: message.threadId,
      role: message.role,
      content: message.content,
      suggestions,
      createdAt: message.createdAt.toISOString(),
    };
  }
}
