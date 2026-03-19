import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@/prisma/client';
import { CustomLoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { ApiaryResponse, CreateApiary, UpdateApiary } from 'shared-schemas';

@Injectable()
export class ApiariesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('ApiariesService');
  }

  async create(
    createApiaryDto: CreateApiary,
    userId: string,
  ): Promise<ApiaryResponse> {
    this.logger.log(`Creating apiary for user ${userId}`);
    this.logger.debug(`Apiary data: ${JSON.stringify(createApiaryDto)}`);

    const apiaryData: Prisma.ApiaryUncheckedCreateInput = {
      name: createApiaryDto.name,
      location: createApiaryDto.location ?? null,
      latitude: createApiaryDto.latitude,
      longitude: createApiaryDto.longitude,
      userId,
    };

    const apiary = await this.prisma.$transaction(async (tx) => {
      const created = await tx.apiary.create({ data: apiaryData });
      await tx.apiaryMember.create({
        data: {
          apiaryId: created.id,
          userId,
          role: 'OWNER',
          invitedById: userId,
          acceptedAt: new Date(),
        },
      });
      return created;
    });

    this.logger.log(`Apiary created with ID: ${apiary.id}`);

    return {
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
      memberRole: 'OWNER',
      memberCount: 1,
    };
  }

  async findAll(userId: string): Promise<ApiaryResponse[]> {
    this.logger.log(`Fetching all apiaries for user ${userId}`);

    const memberships = await this.prisma.apiaryMember.findMany({
      where: {
        userId,
        acceptedAt: { not: null },
      },
      include: {
        apiary: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    this.logger.log(
      `Found ${memberships.length} apiaries for user ${userId}`,
    );
    return memberships.map(({ apiary, role }) => ({
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
      memberRole: role,
      memberCount: apiary._count.members,
    }));
  }

  async findOne(apiaryId: string, userId: string): Promise<ApiaryResponse> {
    this.logger.log(`Fetching apiary ${apiaryId} for user ${userId}`);

    const membership = await this.prisma.apiaryMember.findFirst({
      where: {
        apiaryId,
        userId,
        acceptedAt: { not: null },
      },
      include: {
        apiary: {
          include: {
            _count: { select: { members: true } },
          },
        },
      },
    });

    if (!membership) {
      this.logger.warn(`Apiary ${apiaryId} not found for user ${userId}`);
      throw new NotFoundException();
    }

    this.logger.debug(`Found apiary: ${membership.apiary.name}`);

    return {
      id: membership.apiary.id,
      name: membership.apiary.name,
      location: membership.apiary.location,
      latitude: membership.apiary.latitude,
      longitude: membership.apiary.longitude,
      memberRole: membership.role,
      memberCount: membership.apiary._count.members,
    };
  }

  async update(
    id: string,
    updateApiaryDto: UpdateApiary,
    userId: string,
  ): Promise<ApiaryResponse> {
    this.logger.log(`Updating apiary ${id} for user ${userId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateApiaryDto)}`);

    await this.requireOwner(id, userId);

    try {
      const updatedApiary = await this.prisma.apiary.update({
        where: { id },
        data: updateApiaryDto,
        include: { _count: { select: { members: true } } },
      });

      this.logger.log(`Apiary ${id} updated successfully`);
      return {
        id: updatedApiary.id,
        name: updatedApiary.name,
        location: updatedApiary.location,
        latitude: updatedApiary.latitude,
        longitude: updatedApiary.longitude,
        memberRole: 'OWNER',
        memberCount: updatedApiary._count.members,
      };
    } catch (error: unknown) {
      this.logger.error(
        `Failed to update apiary ${id}`,
        typeof (error as { stack?: string })?.stack === 'string'
          ? String((error as { stack: string }).stack)
          : undefined,
      );
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    this.logger.log(`Removing apiary ${id} for user ${userId}`);

    await this.requireOwner(id, userId);

    try {
      const deletedApiary = await this.prisma.apiary.delete({ where: { id } });
      this.logger.log(`Apiary ${id} removed successfully`);
      return deletedApiary;
    } catch (error: unknown) {
      if (error instanceof Error) {
        this.logger.error(`Failed to remove apiary ${id}`, error.stack);
      } else {
        this.logger.error(
          `Failed to remove apiary ${id}`,
          JSON.stringify(error),
        );
      }
      throw error;
    }
  }

  /**
   * Admin only: Get all apiaries with coordinates for map display
   */
  async findAllWithCoordinates(): Promise<
    {
      id: string;
      name: string;
      latitude: number;
      longitude: number;
      userId: string;
      hiveCount: number;
    }[]
  > {
    this.logger.log('Admin: Fetching all apiaries with coordinates');

    const apiaries = await this.prisma.apiary.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
      },
      include: {
        _count: {
          select: { hives: true },
        },
      },
    });

    this.logger.log(`Found ${apiaries.length} apiaries with coordinates`);

    return apiaries
      .filter((a) => a.latitude !== null && a.longitude !== null)
      .map((apiary) => ({
        id: apiary.id,
        name: apiary.name,
        latitude: apiary.latitude!,
        longitude: apiary.longitude!,
        userId: apiary.userId,
        hiveCount: apiary._count.hives,
      }));
  }

  private async requireOwner(apiaryId: string, userId: string): Promise<void> {
    const membership = await this.prisma.apiaryMember.findFirst({
      where: { apiaryId, userId, role: 'OWNER', acceptedAt: { not: null } },
    });
    if (!membership) {
      throw new ForbiddenException(
        'Only the apiary owner can perform this action',
      );
    }
  }
}
