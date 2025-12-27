import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
    const apiary = await this.prisma.apiary.create({
      data: apiaryData,
    });

    this.logger.log(`Apiary created with ID: ${apiary.id}`);

    return {
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
    };
  }

  async findAll(userId: string): Promise<ApiaryResponse[]> {
    this.logger.log(`Fetching all apiaries for user ${userId}`);

    const apiaries = await this.prisma.apiary.findMany({
      where: {
        userId,
      },
    });

    this.logger.log(`Found ${apiaries.length} apiaries for user ${userId}`);
    return apiaries.map((apiary) => ({
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
    }));
  }

  async findOne(apiaryId: string, userId: string): Promise<ApiaryResponse> {
    this.logger.log(`Fetching apiary ${apiaryId} for user ${userId}`);

    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId,
      },
    });

    if (!apiary) {
      this.logger.warn(`Apiary ${apiaryId} not found for user ${userId}`);
      throw new NotFoundException();
    } else {
      this.logger.debug(`Found apiary: ${apiary.name}`);
    }

    return {
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
    };
  }

  async update(
    id: string,
    updateApiaryDto: UpdateApiary,
    userId: string,
  ): Promise<ApiaryResponse> {
    this.logger.log(`Updating apiary ${id} for user ${userId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateApiaryDto)}`);

    try {
      const updatedApiary = await this.prisma.apiary.update({
        where: { id, userId },
        data: updateApiaryDto,
      });

      this.logger.log(`Apiary ${id} updated successfully`);
      return {
        id: updatedApiary.id,
        name: updatedApiary.name,
        location: updatedApiary.location,
        latitude: updatedApiary.latitude,
        longitude: updatedApiary.longitude,
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

    try {
      const deletedApiary = await this.prisma.apiary.delete({
        where: { id, userId },
      });

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
}
