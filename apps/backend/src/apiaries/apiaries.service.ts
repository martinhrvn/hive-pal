import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Prisma } from '@/prisma/client';
import { CustomLoggerService } from '../logger/logger.service';
import { PrismaService } from '../prisma/prisma.service';
import { FileUploadService } from '../storage/file-upload.service';
import { PrometheusService } from '../health/prometheus/prometheus.service';
import { HiveUpdatedEvent } from '../events/hive.events';
import {
  ApiaryResponse,
  ApiaryListResponse,
  ApplyApiarySeasonsResponse,
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
    private prometheus: PrometheusService,
    private eventEmitter: EventEmitter2,
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
    this.prometheus.incrementApiariesCreated();
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
      const { settings, ...rest } = updateApiaryDto;
      let data: Prisma.ApiaryUpdateInput = rest;
      let seasonsChanged = false;

      if (settings !== undefined) {
        // Settings is one JSON column holding independent keys (inspection
        // type, season templates). Merge so a client that only sends some
        // keys — e.g. the apiary edit form — never wipes the others.
        const existing = await this.prisma.apiary.findFirst({
          where: { id, userId },
          select: { settings: true },
        });
        if (!existing) {
          throw new NotFoundException();
        }
        const current =
          (existing.settings as Record<string, unknown> | null) ?? {};
        const merged = { ...current, ...settings };
        seasonsChanged =
          JSON.stringify(current.seasons) !== JSON.stringify(merged.seasons);
        data = { ...rest, settings: merged };
      }

      const updatedApiary = await this.prisma.apiary.update({
        where: { id, userId },
        data,
        include: {
          featurePhoto: { select: { id: true, storageKey: true } },
        },
      });

      // Hives inherit the apiary's seasons, so their effective inspection
      // interval may have changed: re-run the alert checkers for them.
      if (seasonsChanged) {
        const hives = await this.prisma.hive.findMany({
          where: { apiaryId: id },
          select: { id: true },
        });
        this.emitSettingsUpdated(
          hives.map((hive) => hive.id),
          id,
          userId,
        );
      }

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

  /**
   * Copy the apiary's season template into every hive in the apiary. This is
   * the explicit bulk action behind "Apply to all hives"; it replaces any
   * hive-owned seasons and drops the legacy autumn feeding setting.
   */
  async applySeasonsToHives(
    apiaryId: string,
    userId: string,
  ): Promise<ApplyApiarySeasonsResponse> {
    this.logger.log(`Applying seasons of apiary ${apiaryId} to its hives`);

    const apiary = await this.prisma.apiary.findFirst({
      where: { id: apiaryId, userId },
      select: { id: true, settings: true },
    });

    if (!apiary) {
      throw new NotFoundException();
    }

    const seasons = this.parseSettings(apiary.settings)?.seasons ?? [];
    if (seasons.length === 0) {
      throw new BadRequestException(
        'Add at least one season before applying it to the hives',
      );
    }

    const hives = await this.prisma.hive.findMany({
      where: { apiaryId },
      select: { id: true, settings: true },
    });

    if (hives.length === 0) {
      return { updated: 0 };
    }

    await this.prisma.$transaction(
      hives.map((hive) => {
        const existing = {
          ...((hive.settings as Record<string, unknown> | null) ?? {}),
        };
        delete existing.autumnFeeding;
        return this.prisma.hive.update({
          where: { id: hive.id },
          data: {
            settings: { ...existing, seasons },
          },
        });
      }),
    );

    // Re-run the alert checkers for each hive after the transaction commits.
    this.emitSettingsUpdated(
      hives.map((hive) => hive.id),
      apiaryId,
      userId,
    );

    this.logger.log(
      `Applied seasons of apiary ${apiaryId} to ${hives.length} hives`,
    );
    return { updated: hives.length };
  }

  private emitSettingsUpdated(
    hiveIds: string[],
    apiaryId: string,
    userId: string,
  ) {
    for (const hiveId of hiveIds) {
      this.eventEmitter.emit(
        'hive.updated',
        new HiveUpdatedEvent(hiveId, apiaryId, userId, 'settings'),
      );
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
