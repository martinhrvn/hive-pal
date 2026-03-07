import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InspectionsService } from '../inspections/inspections.service';
import { MetricsService } from '../metrics/metrics.service';
import {
  CreateShareLink,
  ShareLinkResponse,
  SharedResourceResponse,
  ShareResourceType,
} from 'shared-schemas';
import * as crypto from 'crypto';

@Injectable()
export class SharesService {
  constructor(
    private prisma: PrismaService,
    private inspectionsService: InspectionsService,
    private metricsService: MetricsService,
  ) {}

  async createShareLink(
    userId: string,
    dto: CreateShareLink,
    baseUrl: string,
  ): Promise<ShareLinkResponse> {
    // Verify resource ownership
    if (dto.resourceType === ShareResourceType.HARVEST) {
      const harvest = await this.prisma.harvest.findFirst({
        where: { id: dto.resourceId, apiary: { userId } },
      });
      if (!harvest) {
        throw new ForbiddenException('Harvest not found or access denied');
      }
    } else if (dto.resourceType === ShareResourceType.INSPECTION) {
      const inspection = await this.prisma.inspection.findFirst({
        where: { id: dto.resourceId, hive: { apiary: { userId } } },
      });
      if (!inspection) {
        throw new ForbiddenException('Inspection not found or access denied');
      }
    }

    // Check for existing share link
    const existing = await this.prisma.shareLink.findFirst({
      where: {
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        userId,
      },
    });

    if (existing) {
      return this.mapToResponse(existing, baseUrl);
    }

    const token = crypto.randomBytes(16).toString('hex');

    const shareLink = await this.prisma.shareLink.create({
      data: {
        token,
        resourceType: dto.resourceType,
        resourceId: dto.resourceId,
        userId,
      },
    });

    return this.mapToResponse(shareLink, baseUrl);
  }

  async getSharedResource(token: string): Promise<SharedResourceResponse> {
    const shareLink = await this.prisma.shareLink.findUnique({
      where: { token },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
      throw new NotFoundException('Share link has expired');
    }

    if (shareLink.resourceType === (ShareResourceType.HARVEST as string)) {
      return this.getSharedHarvest(shareLink.resourceId);
    } else {
      return this.getSharedInspection(shareLink.resourceId);
    }
  }

  async revokeShareLink(id: string, userId: string): Promise<void> {
    const shareLink = await this.prisma.shareLink.findFirst({
      where: { id, userId },
    });

    if (!shareLink) {
      throw new NotFoundException('Share link not found');
    }

    await this.prisma.shareLink.delete({ where: { id } });
  }

  private async getSharedHarvest(
    harvestId: string,
  ): Promise<SharedResourceResponse> {
    const harvest = await this.prisma.harvest.findUnique({
      where: { id: harvestId },
      include: {
        apiary: { select: { name: true } },
        harvestHives: {
          include: { hive: { select: { name: true } } },
        },
      },
    });

    if (!harvest) {
      throw new NotFoundException('Harvest not found');
    }

    return {
      resourceType: ShareResourceType.HARVEST,
      date: harvest.date.toISOString(),
      totalWeight: harvest.totalWeight,
      totalWeightUnit: harvest.totalWeightUnit,
      status: harvest.status,
      apiaryName: harvest.apiary.name,
      harvestHives: harvest.harvestHives.map((hh) => ({
        hiveName: hh.hive.name,
        framesTaken: hh.framesTaken,
        honeyAmount: hh.honeyAmount,
        honeyAmountUnit: hh.honeyAmountUnit,
      })),
    };
  }

  private async getSharedInspection(
    inspectionId: string,
  ): Promise<SharedResourceResponse> {
    const inspection = await this.prisma.inspection.findUnique({
      where: { id: inspectionId },
      include: {
        hive: { select: { name: true, settings: true } },
        observations: true,
        notes: true,
      },
    });

    if (!inspection) {
      throw new NotFoundException('Inspection not found');
    }

    // Compute scores from observations using the same logic as inspection detail
    const metrics = this.inspectionsService.mapObservationsToDto(
      inspection.observations,
    );
    const hiveScore = this.metricsService.calculateOveralScore(metrics);

    return {
      resourceType: ShareResourceType.INSPECTION,
      date: inspection.date.toISOString(),
      hiveName: inspection.hive.name,
      temperature: inspection.temperature,
      weatherConditions: inspection.weatherConditions,
      observations: inspection.observations.map((obs) => ({
        type: obs.type,
        numericValue: obs.numericValue,
        textValue: obs.textValue,
        booleanValue: obs.booleanValue,
      })),
      scores: {
        overallScore: hiveScore.overallScore ?? null,
        populationScore: hiveScore.populationScore ?? null,
        storesScore: hiveScore.storesScore ?? null,
        queenScore: hiveScore.queenScore ?? null,
      },
      notes: inspection.notes.map((n) => n.text),
    };
  }

  private mapToResponse(
    shareLink: {
      id: string;
      token: string;
      resourceType: string;
      resourceId: string;
      expiresAt: Date | null;
      createdAt: Date;
    },
    baseUrl: string,
  ): ShareLinkResponse {
    return {
      id: shareLink.id,
      token: shareLink.token,
      resourceType: shareLink.resourceType as ShareResourceType,
      resourceId: shareLink.resourceId,
      url: `${baseUrl}/shared/${shareLink.token}`,
      expiresAt: shareLink.expiresAt?.toISOString() ?? null,
      createdAt: shareLink.createdAt.toISOString(),
    };
  }
}
