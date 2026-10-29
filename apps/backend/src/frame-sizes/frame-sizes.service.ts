import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FrameSizeStatus } from '@/prisma/client';

interface CreateFrameSizeData {
  name: string;
  width: number;
  height: number;
  depth: number;
  createdByUserId: string;
}

interface UpdateFrameSizeData {
  name?: string;
  width?: number;
  height?: number;
  depth?: number;
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

  /**
   * Correct a custom frame size. Its creator may edit it, and an admin may
   * edit any non-built-in size (e.g. fixing a typo for an inactive author).
   * Dimensions live on the shared row, so one edit reaches every box that
   * references it.
   *
   * The review status is intentionally left alone: an owner's edit must not
   * drop the size out of other users' pickers while it is in use, and an
   * admin's edit is itself the review decision.
   */
  async update(
    userId: string,
    isAdmin: boolean,
    id: string,
    data: UpdateFrameSizeData,
  ) {
    const frameSize = await this.prisma.frameSize.findUnique({
      where: { id },
    });

    if (!frameSize) {
      throw new NotFoundException(`Frame size with id ${id} not found`);
    }

    if (frameSize.isBuiltIn) {
      throw new BadRequestException('Cannot edit built-in frame sizes');
    }

    if (!isAdmin && frameSize.createdByUserId !== userId) {
      throw new ForbiddenException('You can only edit frame sizes you created');
    }

    const changes: UpdateFrameSizeData = {
      name: data.name,
      width: data.width,
      height: data.height,
      depth: data.depth,
    };

    if (Object.values(changes).every((value) => value === undefined)) {
      throw new BadRequestException('Nothing to update');
    }

    if (changes.name && changes.name !== frameSize.name) {
      const clash = await this.prisma.frameSize.findUnique({
        where: { name: changes.name },
      });
      if (clash) {
        throw new ConflictException(
          'A frame size with this name already exists',
        );
      }
    }

    return this.prisma.frameSize.update({
      where: { id },
      data: changes,
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
