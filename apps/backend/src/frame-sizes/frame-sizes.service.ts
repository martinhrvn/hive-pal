import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FrameSizeStatus } from '@prisma/client';

interface CreateFrameSizeData {
  name: string;
  width: number;
  height: number;
  depth: number;
  createdByUserId: string;
}

@Injectable()
export class FrameSizesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.frameSize.findMany({
      where: {
        OR: [{ status: FrameSizeStatus.APPROVED }, { createdByUserId: userId }],
      },
      orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
    });
  }

  async create(data: CreateFrameSizeData) {
    return this.prisma.frameSize.create({
      data: {
        name: data.name,
        width: data.width,
        height: data.height,
        depth: data.depth,
        status: FrameSizeStatus.PENDING,
        createdByUserId: data.createdByUserId,
      },
    });
  }

  async findPending() {
    return this.prisma.frameSize.findMany({
      where: { status: FrameSizeStatus.PENDING },
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllAdmin() {
    return this.prisma.frameSize.findMany({
      include: {
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [{ isBuiltIn: 'desc' }, { name: 'asc' }],
    });
  }

  async approve(id: string) {
    const frameSize = await this.prisma.frameSize.findUnique({
      where: { id },
    });

    if (!frameSize) {
      throw new NotFoundException(`Frame size with id ${id} not found`);
    }

    return this.prisma.frameSize.update({
      where: { id },
      data: { status: FrameSizeStatus.APPROVED },
    });
  }

  async reject(id: string) {
    const frameSize = await this.prisma.frameSize.findUnique({
      where: { id },
    });

    if (!frameSize) {
      throw new NotFoundException(`Frame size with id ${id} not found`);
    }

    return this.prisma.frameSize.update({
      where: { id },
      data: { status: FrameSizeStatus.REJECTED },
    });
  }

  async remove(id: string) {
    const frameSize = await this.prisma.frameSize.findUnique({
      where: { id },
    });

    if (!frameSize) {
      throw new NotFoundException(`Frame size with id ${id} not found`);
    }

    if (frameSize.isBuiltIn) {
      throw new BadRequestException('Cannot delete built-in frame sizes');
    }

    return this.prisma.frameSize.delete({
      where: { id },
    });
  }
}
