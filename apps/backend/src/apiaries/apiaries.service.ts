import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@/prisma/client';
import { CustomLoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileUploadService } from '../storage/file-upload.service';
import {
  ApiaryResponse,
  ApiaryListResponse,
  CreateApiary,
  UpdateApiary,
  apiarySettingsSchema,
  ApiarySettings,
} from 'shared-schemas';

@Injectable()
export class ApiariesService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
    private fileUpload: FileUploadService,
  ) {
    this.logger.setContext('ApiariesService');
  }

  private parseSettings(
    raw: Prisma.JsonValue | null | undefined,
  ): ApiarySettings {
    const result = apiarySettingsSchema.safeParse(raw);
    return result.success ? result.data : undefined;
  }

  private async mapFeaturePhotoUrl(
    featurePhoto: { id: string; storageKey: string } | null,
  ): Promise<{
    featurePhotoId: string | null;
    featurePhotoUrl: string | null;
  }> {
    if (!featurePhoto) {
      return { featurePhotoId: null, featurePhotoUrl: null };
    }
    try {
      const { downloadUrl } = await this.fileUpload.getDownloadUrl(
        featurePhoto.storageKey,
      );
      return { featurePhotoId: featurePhoto.id, featurePhotoUrl: downloadUrl };
    } catch {
      return { featurePhotoId: featurePhoto.id, featurePhotoUrl: null };
    }
  }

  private async mapApiaryToResponse(
    apiary: {
      id: string;
      name: string;
      location: string | null;
      latitude: number | null;
      longitude: number | null;
      settings: Prisma.JsonValue;
      featurePhoto: { id: string; storageKey: string } | null;
      userId: string;
      members?: Array<{ role: 'OWNER' | 'EDITOR' | 'VIEWER' }>;
      _count?: { hives: number };
    },
    userId: string,
  ): Promise<ApiaryResponse> {
    const featurePhotoFields = await this.mapFeaturePhotoUrl(
      apiary.featurePhoto,
    );
    const isOwner = apiary.userId === userId;

    return {
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
      settings: this.parseSettings(apiary.settings),
      ...(apiary._count && { hiveCount: apiary._count.hives }),
      ...featurePhotoFields,
      ...(apiary.members && {
        role: isOwner ? ('OWNER' as const) : apiary.members[0]?.role,
        isShared: !isOwner,
      }),
    };
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
      featurePhotoId: createApiaryDto.featurePhotoId ?? null,
      settings: createApiaryDto.settings ?? undefined,
      userId,
    };
    const apiary = await this.prisma.apiary.create({
      data: apiaryData,
      include: {
        featurePhoto: { select: { id: true, storageKey: true } },
      },
    });

    this.logger.log(`Apiary created with ID: ${apiary.id}`);
    return this.mapApiaryToResponse(apiary, userId);
  }

  async findAll(userId: string): Promise<ApiaryListResponse> {
    this.logger.log(`Fetching all apiaries for user ${userId}`);

    const [apiaries, pendingMemberships] = await Promise.all([
      this.prisma.apiary.findMany({
        where: {
          OR: [{ userId }, { members: { some: { userId, status: 'ACTIVE' } } }],
        },
        include: {
          featurePhoto: { select: { id: true, storageKey: true } },
          members: {
            where: { userId, status: 'ACTIVE' },
            select: { role: true },
          },
          _count: { select: { hives: true } },
        },
      }),
      this.prisma.apiaryMember.count({
        where: { userId, status: 'PENDING' },
      }),
    ]);

    this.logger.log(`Found ${apiaries.length} apiaries for user ${userId}`);
    const apiaryResponses = await Promise.all(
      apiaries.map((apiary) => this.mapApiaryToResponse(apiary, userId)),
    );

    return { apiaries: apiaryResponses, pendingMemberships };
  }

  async findOne(apiaryId: string, userId: string): Promise<ApiaryResponse> {
    this.logger.log(`Fetching apiary ${apiaryId} for user ${userId}`);

    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        OR: [{ userId }, { members: { some: { userId, status: 'ACTIVE' } } }],
      },
      include: {
        featurePhoto: { select: { id: true, storageKey: true } },
        members: {
          where: { userId, status: 'ACTIVE' },
          select: { role: true },
        },
        _count: { select: { hives: true } },
      },
    });

    if (!apiary) {
      this.logger.warn(`Apiary ${apiaryId} not found for user ${userId}`);
      throw new NotFoundException();
    } else {
      this.logger.debug(`Found apiary: ${apiary.name}`);
    }

    return this.mapApiaryToResponse(apiary, userId);
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
        include: {
          featurePhoto: { select: { id: true, storageKey: true } },
        },
      });

      this.logger.log(`Apiary ${id} updated successfully`);
      return this.mapApiaryToResponse(updatedApiary, userId);
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
