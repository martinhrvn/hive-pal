import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import {
  CreateMeasurementBatch,
  CreateMeasurementBatchResponse,
  LatestMeasurementsResponse,
  MeasurementFilter,
  MeasurementResponse,
} from 'shared-schemas';

interface LatestRow {
  metric: string;
  value: number;
  unit: string | null;
  recordedAt: Date;
  source: string | null;
}

@Injectable()
export class MeasurementsService {
  constructor(
    private prisma: PrismaService,
    private logger: CustomLoggerService,
  ) {
    this.logger.setContext('MeasurementsService');
  }

  async createBatch(
    hiveId: string,
    apiaryId: string,
    dto: CreateMeasurementBatch,
  ): Promise<CreateMeasurementBatchResponse> {
    await this.assertHiveInApiary(hiveId, apiaryId);

    const now = new Date();
    const rows = dto.measurements.map((m) => ({
      hiveId,
      metric: m.metric,
      value: m.value,
      unit: m.unit ?? null,
      recordedAt: m.recordedAt ? new Date(m.recordedAt) : now,
      source: m.source ?? null,
    }));

    const result = await this.prisma.measurement.createMany({ data: rows });

    this.logger.log({
      message: 'Measurements ingested',
      hiveId,
      apiaryId,
      count: result.count,
    });

    return { inserted: result.count };
  }

  async findForHive(
    hiveId: string,
    apiaryId: string,
    filter: MeasurementFilter,
  ): Promise<MeasurementResponse[]> {
    await this.assertHiveInApiary(hiveId, apiaryId);

    const where: {
      hiveId: string;
      metric?: string;
      recordedAt?: { gte?: Date; lte?: Date };
    } = { hiveId };

    if (filter.metric) where.metric = filter.metric;
    if (filter.from || filter.to) {
      where.recordedAt = {};
      if (filter.from) where.recordedAt.gte = new Date(filter.from);
      if (filter.to) where.recordedAt.lte = new Date(filter.to);
    }

    const rows = await this.prisma.measurement.findMany({
      where,
      orderBy: { recordedAt: 'desc' },
      take: filter.limit ?? 1000,
    });

    return rows.map((r) => ({
      id: r.id,
      hiveId: r.hiveId,
      metric: r.metric,
      value: r.value,
      unit: r.unit,
      recordedAt: r.recordedAt.toISOString(),
      source: r.source,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async findLatestForHive(
    hiveId: string,
    apiaryId: string,
  ): Promise<LatestMeasurementsResponse> {
    await this.assertHiveInApiary(hiveId, apiaryId);

    const rows = await this.prisma.$queryRaw<LatestRow[]>`
      SELECT DISTINCT ON (metric)
        metric, value, unit, "recordedAt", source
      FROM "Measurement"
      WHERE "hiveId" = ${hiveId}
      ORDER BY metric, "recordedAt" DESC
    `;

    const result: LatestMeasurementsResponse = {};
    for (const row of rows) {
      result[row.metric] = {
        value: row.value,
        unit: row.unit,
        recordedAt: row.recordedAt.toISOString(),
        source: row.source,
      };
    }
    return result;
  }

  private async assertHiveInApiary(
    hiveId: string,
    apiaryId: string,
  ): Promise<void> {
    const hive = await this.prisma.hive.findFirst({
      where: { id: hiveId, apiaryId },
      select: { id: true },
    });

    if (!hive) {
      throw new NotFoundException(`Hive with ID ${hiveId} not found in apiary`);
    }
  }
}
