import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FeedbackType, FeedbackStatus, Prisma } from '@prisma/client';

interface CreateFeedbackData {
  userId?: string | null;
  email?: string;
  type: FeedbackType;
  subject: string;
  message: string;
}

interface FindAllOptions {
  type?: FeedbackType;
  status?: FeedbackStatus;
  limit?: number;
  offset?: number;
}

@Injectable()
export class FeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateFeedbackData) {
    return this.prisma.feedback.create({
      data: {
        userId: data.userId,
        email: data.email,
        type: data.type,
        subject: data.subject,
        message: data.message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(options: FindAllOptions) {
    const where: Prisma.FeedbackWhereInput = {};

    if (options.type) {
      where.type = options.type;
    }

    if (options.status) {
      where.status = options.status;
    }

    const limit = Number(options.limit);
    const offset = Number(options.offset);

    const [feedbacks, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: limit || 50,
        skip: offset || 0,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return {
      feedbacks,
      total,
      limit: options.limit,
      offset: options.offset,
    };
  }

  async findByUserId(userId: string) {
    return this.prisma.feedback.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.feedback.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: FeedbackStatus) {
    return this.prisma.feedback.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return this.prisma.feedback.delete({
      where: { id },
    });
  }
}
