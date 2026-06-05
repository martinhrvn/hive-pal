import { NotFoundException } from '@nestjs/common';
import { Readable } from 'stream';
import type { Response } from 'express';
import { AssistantService } from './assistant.service';
import { AssistantRepository } from './assistant.repository';
import { ContextBuilderService } from './context-builder.service';
import { AssistantAiService } from './assistant-ai.service';
import { CustomLoggerService } from '../logger/logger.service';
import { AssistantRole } from '@/prisma/client';

describe('AssistantService', () => {
  let service: AssistantService;
  let repository: jest.Mocked<
    Pick<
      AssistantRepository,
      | 'hiveInApiary'
      | 'createThread'
      | 'listThreads'
      | 'findThread'
      | 'findThreadWithMessages'
      | 'deleteThread'
      | 'addMessage'
    >
  >;
  let ai: jest.Mocked<Pick<AssistantAiService, 'assertEnabled' | 'streamChat'>>;
  let contextBuilder: jest.Mocked<
    Pick<ContextBuilderService, 'buildSystemMessage'>
  >;

  beforeEach(() => {
    repository = {
      hiveInApiary: jest.fn(),
      createThread: jest.fn(),
      listThreads: jest.fn(),
      findThread: jest.fn(),
      findThreadWithMessages: jest.fn(),
      deleteThread: jest.fn(),
      addMessage: jest.fn(),
    };
    ai = { assertEnabled: jest.fn(), streamChat: jest.fn() };
    contextBuilder = { buildSystemMessage: jest.fn() };
    const logger = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    } as unknown as CustomLoggerService;

    service = new AssistantService(
      repository as unknown as AssistantRepository,
      contextBuilder as unknown as ContextBuilderService,
      ai as unknown as AssistantAiService,
      logger,
    );
  });

  const thread = {
    id: 'thread-1',
    apiaryId: 'apiary-1',
    hiveId: null,
    title: 'Apiary advisor',
    createdAt: new Date('2026-05-01T00:00:00.000Z'),
    updatedAt: new Date('2026-05-01T00:00:00.000Z'),
  };

  describe('createThread', () => {
    it('rejects a hiveId that does not belong to the caller apiary', async () => {
      repository.hiveInApiary.mockResolvedValue(false);
      await expect(
        service.createThread(
          { apiaryId: 'apiary-1', hiveId: 'hive-x' },
          'apiary-1',
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.createThread).not.toHaveBeenCalled();
    });

    it('always creates the thread under the caller authorized apiaryId', async () => {
      repository.createThread.mockResolvedValue(thread);
      // Body claims a different apiary, but the guard-derived apiaryId wins.
      await service.createThread({ apiaryId: 'other-apiary' }, 'apiary-1');
      expect(repository.createThread).toHaveBeenCalledWith(
        expect.objectContaining({ apiaryId: 'apiary-1', hiveId: null }),
      );
    });
  });

  describe('getThread', () => {
    it('scopes the lookup to the caller apiary and 404s when missing', async () => {
      repository.findThreadWithMessages.mockResolvedValue(null);
      await expect(
        service.getThread('thread-1', 'apiary-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findThreadWithMessages).toHaveBeenCalledWith(
        'thread-1',
        'apiary-1',
      );
    });

    it('maps messages including suggestions', async () => {
      repository.findThreadWithMessages.mockResolvedValue({
        ...thread,
        messages: [
          {
            id: 'm1',
            threadId: 'thread-1',
            role: AssistantRole.USER,
            content: 'hi',
            suggestions: null,
            createdAt: new Date('2026-05-01T00:00:00.000Z'),
          },
        ],
      });
      const res = await service.getThread('thread-1', 'apiary-1');
      expect(res.id).toBe('thread-1');
      expect(res.messages).toHaveLength(1);
      expect(res.messages[0].suggestions).toBeNull();
    });
  });

  describe('deleteThread', () => {
    it('404s when the thread is not in the caller apiary', async () => {
      repository.deleteThread.mockResolvedValue(false);
      await expect(
        service.deleteThread('thread-1', 'apiary-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.deleteThread).toHaveBeenCalledWith(
        'thread-1',
        'apiary-1',
      );
    });

    it('resolves when a thread was deleted', async () => {
      repository.deleteThread.mockResolvedValue(true);
      await expect(
        service.deleteThread('thread-1', 'apiary-1'),
      ).resolves.toBeUndefined();
    });
  });

  describe('streamMessage', () => {
    const makeRes = () => {
      const writes: string[] = [];
      const end = jest.fn();
      const res = {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn((chunk: string) => {
          writes.push(chunk);
          return true;
        }),
        end,
      } as unknown as Response;
      return { res, writes, end };
    };

    it('404s before opening the stream when the thread is foreign', async () => {
      repository.findThread.mockResolvedValue(null);
      const { res } = makeRes();
      await expect(
        service.streamMessage('t1', 'apiary-1', 'user-1', 'hi', res),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repository.findThread).toHaveBeenCalledWith('t1', 'apiary-1');
      expect(ai.streamChat).not.toHaveBeenCalled();
    });

    it('streams Ollama NDJSON as SSE tokens then persists the reply', async () => {
      repository.findThread.mockResolvedValue(thread);
      repository.findThreadWithMessages.mockResolvedValue({
        ...thread,
        messages: [
          {
            id: 'u1',
            threadId: 'thread-1',
            role: AssistantRole.USER,
            content: 'How are my bees?',
            suggestions: null,
            createdAt: new Date('2026-05-01T00:00:00.000Z'),
          },
        ],
      });
      contextBuilder.buildSystemMessage.mockResolvedValue('SYSTEM CONTEXT');
      repository.addMessage.mockImplementation(
        (data) =>
          Promise.resolve({
            id: 'saved',
            threadId: data.threadId,
            role: data.role,
            content: data.content,
            suggestions: null,
            createdAt: new Date('2026-05-01T00:00:00.000Z'),
          }) as never,
      );

      // Two NDJSON chunks, the second split across a buffer boundary.
      const ndjson = Readable.from([
        Buffer.from(
          '{"message":{"content":"Your bees "},"done":false}\n{"message":{"con',
        ),
        Buffer.from('tent":"look healthy."},"done":true}\n'),
      ]);
      ai.streamChat.mockResolvedValue(ndjson);

      const { res, writes, end } = makeRes();
      await service.streamMessage(
        'thread-1',
        'apiary-1',
        'user-1',
        'How are my bees?',
        res,
      );

      // Fresh system context re-injected as the first message.
      const sentMessages = ai.streamChat.mock.calls[0][0];
      expect(sentMessages[0]).toEqual({
        role: 'system',
        content: 'SYSTEM CONTEXT',
      });

      const events = writes.map(
        (w) =>
          JSON.parse(w.replace(/^data: /, '').trim()) as {
            type: string;
            content?: string;
          },
      );
      const tokens = events
        .filter((e) => e.type === 'token')
        .map((e) => e.content ?? '')
        .join('');
      expect(tokens).toBe('Your bees look healthy.');
      expect(events.at(-1)?.type).toBe('done');

      // User turn + assistant turn persisted.
      expect(repository.addMessage).toHaveBeenCalledTimes(2);
      expect(repository.addMessage).toHaveBeenLastCalledWith(
        expect.objectContaining({
          role: AssistantRole.ASSISTANT,
          content: 'Your bees look healthy.',
        }),
      );
      expect(end).toHaveBeenCalled();
    });
  });

  describe('parseSuggestions', () => {
    it('returns null when no fenced json block is present', () => {
      expect(service.parseSuggestions('just prose, no block')).toBeNull();
    });

    it('parses a valid fenced action suggestion block', () => {
      const content = [
        'You should feed this hive.',
        '```json',
        JSON.stringify([
          {
            kind: 'action',
            type: 'FEEDING',
            details: {
              type: 'FEEDING',
              feedType: 'Sugar Syrup',
              amount: 2,
              unit: 'liters',
            },
            reason: 'Low stores',
          },
        ]),
        '```',
      ].join('\n');
      const parsed = service.parseSuggestions(content);
      expect(parsed).not.toBeNull();
      expect(parsed).toHaveLength(1);
      expect(parsed?.[0].kind).toBe('action');
    });

    it('ignores invalid suggestion blocks', () => {
      const content = '```json\n[{"kind":"action","type":"NOPE"}]\n```';
      expect(service.parseSuggestions(content)).toBeNull();
    });
  });
});
