import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssistantRole, Prisma } from '@/prisma/client';
import { AssistantSuggestions } from 'shared-schemas';

export interface CreateThreadData {
  apiaryId: string;
  hiveId?: string | null;
  title: string;
}

export interface AddMessageData {
  threadId: string;
  role: AssistantRole;
  content: string;
  suggestions?: AssistantSuggestions | null;
}

/**
 * Data access for assistant threads/messages. Every lookup is scoped by
 * apiaryId (the apiary the ApiaryContextGuard already authorized the caller
 * for), so a user can never read or write another apiary's threads.
 */
@Injectable()
export class AssistantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async hiveInApiary(hiveId: string, apiaryId: string): Promise<boolean> {
    const hive = await this.prisma.hive.findFirst({
      where: { id: hiveId, apiaryId },
      select: { id: true },
    });
    return hive !== null;
  }

  createThread(data: CreateThreadData) {
    return this.prisma.assistantThread.create({
      data: {
        apiaryId: data.apiaryId,
        hiveId: data.hiveId ?? null,
        title: data.title,
      },
    });
  }

  listThreads(apiaryId: string, hiveId?: string | null) {
    return this.prisma.assistantThread.findMany({
      where: {
        apiaryId,
        hiveId: hiveId ?? null,
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  findThread(id: string, apiaryId: string) {
    return this.prisma.assistantThread.findFirst({
      where: { id, apiaryId },
    });
  }

  findThreadWithMessages(id: string, apiaryId: string) {
    return this.prisma.assistantThread.findFirst({
      where: { id, apiaryId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async deleteThread(id: string, apiaryId: string): Promise<boolean> {
    const result = await this.prisma.assistantThread.deleteMany({
      where: { id, apiaryId },
    });
    return result.count > 0;
  }

  addMessage(data: AddMessageData) {
    return this.prisma.$transaction(async (tx) => {
      const message = await tx.assistantMessage.create({
        data: {
          threadId: data.threadId,
          role: data.role,
          content: data.content,
          suggestions:
            data.suggestions == null
              ? Prisma.JsonNull
              : (data.suggestions as unknown as Prisma.InputJsonValue),
        },
      });
      // Keep the thread's updatedAt fresh so lists sort by recent activity.
      await tx.assistantThread.update({
        where: { id: data.threadId },
        data: { updatedAt: new Date() },
      });
      return message;
    });
  }
}
