import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import archiver from 'archiver';
import { CURRENT_EXPORT_VERSION } from 'shared-schemas';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.interface';
import { AccountTransferService } from './account-transfer.service';

const RESULT_TTL_DAYS = 7;

function safeExt(fileName: string, mimeType: string): string {
  const fromName = path.extname(fileName);
  if (fromName) return fromName;
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'audio/webm': '.webm',
    'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',
    'audio/wav': '.wav',
    'application/pdf': '.pdf',
  };
  return map[mimeType] ?? '';
}

interface ExportStats {
  apiariesExported: number;
  hivesExported: number;
  inspectionsExported: number;
  actionsExported: number;
  attachmentsExported: number;
  totalBytes: number;
}

@Injectable()
export class AccountTransferExportRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly logger: CustomLoggerService,
    private readonly jobs: AccountTransferService,
    private readonly config: ConfigService,
  ) {
    this.logger.setContext('AccountTransferExportRunner');
  }

  async run(jobId: string, userId: string): Promise<void> {
    let tmpPath: string | null = null;
    try {
      await this.jobs.markRunning(jobId);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });
      if (!user) throw new Error('User not found');

      tmpPath = path.join(os.tmpdir(), `account-export-${jobId}.zip`);

      const stats = await this.buildArchive(jobId, userId, user.email, tmpPath);

      const resultKey = `account-transfer/exports/${userId}/${jobId}.zip`;
      const readStream = createReadStream(tmpPath);
      await this.storage.uploadStream(resultKey, readStream, 'application/zip');

      const resultExpiresAt = new Date(
        Date.now() + RESULT_TTL_DAYS * 24 * 60 * 60 * 1000,
      );

      await this.jobs.markCompleted(jobId, {
        summary: stats,
        resultStorageKey: resultKey,
        resultExpiresAt,
      });

      this.logger.log({
        message: 'Export job completed',
        jobId,
        userId,
        ...stats,
      });
    } catch (err) {
      const message = (err as Error).message ?? 'Unknown error';
      this.logger.error({
        message: 'Export job failed',
        jobId,
        userId,
        error: message,
        stack: (err as Error).stack,
      });
      await this.jobs.markFailed(jobId, message);
    } finally {
      if (tmpPath) {
        try {
          await fs.unlink(tmpPath);
        } catch {
          // ignore
        }
      }
    }
  }

  private async buildArchive(
    jobId: string,
    userId: string,
    userEmail: string,
    outputPath: string,
  ): Promise<ExportStats> {
    const archive = archiver('zip', { zlib: { level: 6 } });
    const output = createWriteStream(outputPath);
    const finished = new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      output.on('error', reject);
      archive.on('error', reject);
    });
    archive.pipe(output);

    const stats: ExportStats = {
      apiariesExported: 0,
      hivesExported: 0,
      inspectionsExported: 0,
      actionsExported: 0,
      attachmentsExported: 0,
      totalBytes: 0,
    };

    const apiaries = await this.prisma.apiary.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const apiaryExports: unknown[] = [];

    for (let i = 0; i < apiaries.length; i++) {
      const a = apiaries[i];
      await this.jobs.setProgress(
        jobId,
        `Exporting apiary ${i + 1} of ${apiaries.length} (${a.name})`,
      );
      const exported = await this.exportApiary(a.id, archive, stats);
      apiaryExports.push(exported);
      stats.apiariesExported++;
    }

    await this.jobs.setProgress(jobId, 'Exporting user settings');
    const userConfig = await this.exportUserConfig(userId);

    const envelope = {
      version: CURRENT_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      sourceInstance: {
        hostname: os.hostname(),
        appVersion: this.config.get<string>('APP_VERSION') ?? null,
      },
      sourceUser: { email: userEmail },
      apiaries: apiaryExports,
      userConfig,
    };

    archive.append(JSON.stringify(envelope, null, 2), { name: 'data.json' });
    await this.jobs.setProgress(jobId, 'Finalizing archive');
    await archive.finalize();
    await finished;

    stats.totalBytes = (await fs.stat(outputPath)).size;
    return stats;
  }

  private async exportApiary(
    apiaryId: string,
    archive: archiver.Archiver,
    stats: ExportStats,
  ): Promise<unknown> {
    const apiary = await this.prisma.apiary.findUniqueOrThrow({
      where: { id: apiaryId },
    });

    const hives = await this.prisma.hive.findMany({
      where: { apiaryId },
      include: {
        boxes: true,
        queens: { include: { movements: true } },
        inspections: {
          include: {
            notes: true,
            observations: true,
            audioRecordings: true,
          },
        },
        actions: {
          include: {
            feedingAction: true,
            treatmentAction: true,
            frameAction: true,
            harvestAction: true,
            boxConfigurationAction: true,
            maintenanceAction: true,
          },
        },
        measurements: true,
        alerts: true,
      },
    });

    const harvests = await this.prisma.harvest.findMany({
      where: { apiaryId },
      include: { harvestHives: true },
    });

    const batchInspections = await this.prisma.batchInspection.findMany({
      where: { apiaryId },
      include: { hives: true },
    });

    const quickChecks = await this.prisma.quickCheck.findMany({
      where: { apiaryId },
      include: { photos: true },
    });

    const photos = await this.prisma.photo.findMany({
      where: { apiaryId },
    });

    const documents = await this.prisma.document.findMany({
      where: { apiaryId },
    });

    const members = await this.prisma.apiaryMember.findMany({
      where: { apiaryId, status: 'ACTIVE' },
      include: { user: { select: { email: true } } },
    });

    // Stream attachments into archive
    for (const photo of photos) {
      const name = `attachments/photos/${photo.id}${safeExt(photo.fileName, photo.mimeType)}`;
      const ok = await this.appendFromStorage(archive, photo.storageKey, name);
      if (ok) stats.attachmentsExported++;
    }
    for (const doc of documents) {
      const name = `attachments/documents/${doc.id}${safeExt(doc.fileName, doc.mimeType)}`;
      const ok = await this.appendFromStorage(archive, doc.storageKey, name);
      if (ok) stats.attachmentsExported++;
    }
    for (const hive of hives) {
      for (const inspection of hive.inspections) {
        for (const audio of inspection.audioRecordings) {
          const name = `attachments/audio/${audio.id}${safeExt(audio.fileName, audio.mimeType)}`;
          const ok = await this.appendFromStorage(
            archive,
            audio.storageKey,
            name,
          );
          if (ok) stats.attachmentsExported++;
        }
      }
    }
    for (const qc of quickChecks) {
      for (const photo of qc.photos) {
        const name = `attachments/quick-check-photos/${photo.id}${safeExt(photo.fileName, photo.mimeType)}`;
        const ok = await this.appendFromStorage(
          archive,
          photo.storageKey,
          name,
        );
        if (ok) stats.attachmentsExported++;
      }
    }

    stats.hivesExported += hives.length;
    for (const h of hives) {
      stats.inspectionsExported += h.inspections.length;
      stats.actionsExported += h.actions.length;
    }

    return {
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      latitude: apiary.latitude,
      longitude: apiary.longitude,
      notes: apiary.notes,
      settings: apiary.settings,
      featurePhotoId: apiary.featurePhotoId,
      hives: hives.map((h) => ({
        id: h.id,
        name: h.name,
        notes: h.notes,
        status: h.status,
        installationDate: h.installationDate?.toISOString() ?? null,
        positionRow: h.positionRow,
        positionCol: h.positionCol,
        settings: h.settings,
        featurePhotoId: h.featurePhotoId,
        boxes: h.boxes.map((b) => ({
          id: b.id,
          position: b.position,
          frameCount: b.frameCount,
          maxFrameCount: b.maxFrameCount,
          hasExcluder: b.hasExcluder,
          type: b.type,
          variant: b.variant,
          frameSizeId: b.frameSizeId,
          color: b.color,
          lastSanitized: b.lastSanitized?.toISOString() ?? null,
          addedAt: b.addedAt.toISOString(),
          winterized: b.winterized,
        })),
        queens: h.queens.map((q) => ({
          id: q.id,
          name: q.name,
          marking: q.marking,
          color: q.color,
          year: q.year,
          source: q.source,
          status: q.status,
          installedAt: q.installedAt?.toISOString() ?? null,
          replacedAt: q.replacedAt?.toISOString() ?? null,
          movements: q.movements.map((m) => ({
            id: m.id,
            fromHiveId: m.fromHiveId,
            toHiveId: m.toHiveId,
            movedAt: m.movedAt.toISOString(),
            reason: m.reason,
            notes: m.notes,
            createdAt: m.createdAt.toISOString(),
          })),
        })),
        inspections: h.inspections.map((i) => ({
          id: i.id,
          hiveId: i.hiveId,
          date: i.date.toISOString(),
          isAllDay: i.isAllDay,
          temperature: i.temperature,
          weatherConditions: i.weatherConditions,
          status: i.status,
          overallScore: i.overallScore,
          populationScore: i.populationScore,
          storesScore: i.storesScore,
          queenScore: i.queenScore,
          scoreWarnings: i.scoreWarnings,
          scoreConfidence: i.scoreConfidence,
          notes: i.notes.map((n) => ({ id: n.id, text: n.text })),
          observations: i.observations.map((o) => ({
            id: o.id,
            type: o.type,
            numericValue: o.numericValue,
            textValue: o.textValue,
            booleanValue: o.booleanValue,
            notes: o.notes,
          })),
          audioRecordings: i.audioRecordings.map((a) => ({
            id: a.id,
            fileName: a.fileName,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
            duration: a.duration,
            transcription: a.transcription,
            transcriptionStatus: a.transcriptionStatus,
            analysisStatus: a.analysisStatus,
            analysisResult: a.analysisResult,
            createdAt: a.createdAt.toISOString(),
          })),
        })),
        actions: h.actions.map((a) => ({
          id: a.id,
          hiveId: a.hiveId,
          inspectionId: a.inspectionId,
          harvestId: a.harvestId,
          type: a.type,
          notes: a.notes,
          date: a.date.toISOString(),
          details: this.extractActionDetails(a),
        })),
        measurements: h.measurements.map((m) => ({
          id: m.id,
          metric: m.metric,
          value: m.value,
          unit: m.unit,
          recordedAt: m.recordedAt.toISOString(),
          source: m.source,
        })),
        alerts: h.alerts.map((al) => ({
          id: al.id,
          type: al.type,
          message: al.message,
          severity: al.severity,
          status: al.status,
          metadata: al.metadata,
          createdAt: al.createdAt.toISOString(),
        })),
      })),
      harvests: harvests.map((h) => ({
        id: h.id,
        date: h.date.toISOString(),
        status: h.status,
        totalWeight: h.totalWeight,
        totalWeightUnit: h.totalWeightUnit,
        notes: h.notes,
        harvestHives: h.harvestHives.map((hh) => ({
          id: hh.id,
          hiveId: hh.hiveId,
          framesTaken: hh.framesTaken,
          honeyAmount: hh.honeyAmount,
          honeyAmountUnit: hh.honeyAmountUnit,
          honeyPercentage: hh.honeyPercentage,
        })),
      })),
      batchInspections: batchInspections.map((b) => ({
        id: b.id,
        name: b.name,
        status: b.status,
        startedAt: b.startedAt?.toISOString() ?? null,
        completedAt: b.completedAt?.toISOString() ?? null,
        hives: b.hives.map((bh) => ({
          id: bh.id,
          hiveId: bh.hiveId,
          order: bh.order,
          status: bh.status,
          inspectionId: bh.inspectionId,
          completedAt: bh.completedAt?.toISOString() ?? null,
          skippedCount: bh.skippedCount,
        })),
      })),
      quickChecks: quickChecks.map((q) => ({
        id: q.id,
        hiveId: q.hiveId,
        date: q.date.toISOString(),
        note: q.note,
        tags: q.tags,
        photos: q.photos.map((p) => ({
          id: p.id,
          fileName: p.fileName,
          mimeType: p.mimeType,
          fileSize: p.fileSize,
        })),
      })),
      photos: photos.map((p) => ({
        id: p.id,
        hiveId: p.hiveId,
        inspectionId: p.inspectionId,
        caption: p.caption,
        fileName: p.fileName,
        mimeType: p.mimeType,
        fileSize: p.fileSize,
        date: p.date.toISOString(),
        isFeatureOfApiary: apiary.featurePhotoId === p.id,
      })),
      documents: documents.map((d) => ({
        id: d.id,
        hiveId: d.hiveId,
        title: d.title,
        notes: d.notes,
        fileName: d.fileName,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
        date: d.date.toISOString(),
      })),
      members: members.map((m) => ({
        email: m.user.email,
        role: m.role,
      })),
    };
  }

  private extractActionDetails(a: {
    feedingAction: unknown;
    treatmentAction: unknown;
    frameAction: unknown;
    harvestAction: unknown;
    boxConfigurationAction: unknown;
    maintenanceAction: unknown;
  }): { kind: string; data: Record<string, unknown> } | null {
    if (a.feedingAction) {
      const {
        id: _id,
        actionId: _a,
        ...rest
      } = a.feedingAction as {
        id: string;
        actionId: string;
      };
      return { kind: 'FEEDING', data: rest as Record<string, unknown> };
    }
    if (a.treatmentAction) {
      const {
        id: _id,
        actionId: _a,
        ...rest
      } = a.treatmentAction as {
        id: string;
        actionId: string;
      };
      return { kind: 'TREATMENT', data: rest as Record<string, unknown> };
    }
    if (a.frameAction) {
      const {
        id: _id,
        actionId: _a,
        ...rest
      } = a.frameAction as {
        id: string;
        actionId: string;
      };
      return { kind: 'FRAME', data: rest as Record<string, unknown> };
    }
    if (a.harvestAction) {
      const {
        id: _id,
        actionId: _a,
        ...rest
      } = a.harvestAction as {
        id: string;
        actionId: string;
      };
      return { kind: 'HARVEST', data: rest as Record<string, unknown> };
    }
    if (a.boxConfigurationAction) {
      const {
        id: _id,
        actionId: _a,
        ...rest
      } = a.boxConfigurationAction as {
        id: string;
        actionId: string;
      };
      return {
        kind: 'BOX_CONFIGURATION',
        data: rest as Record<string, unknown>,
      };
    }
    if (a.maintenanceAction) {
      const {
        id: _id,
        actionId: _a,
        ...rest
      } = a.maintenanceAction as {
        id: string;
        actionId: string;
      };
      return { kind: 'MAINTENANCE', data: rest as Record<string, unknown> };
    }
    return null;
  }

  private async exportUserConfig(userId: string): Promise<unknown> {
    const equipmentItems = await this.prisma.equipmentItem.findMany({
      where: { userId },
    });
    const equipmentMultiplier =
      await this.prisma.equipmentMultiplier.findUnique({
        where: { userId },
      });
    const frameSizes = await this.prisma.frameSize.findMany({
      where: { createdByUserId: userId, isBuiltIn: false },
    });
    return {
      equipmentItems: equipmentItems.map((e) => ({
        id: e.id,
        itemId: e.itemId,
        name: e.name,
        enabled: e.enabled,
        perHive: e.perHive,
        extra: e.extra,
        inExtraction: e.inExtraction,
        damaged: e.damaged,
        neededOverride: e.neededOverride,
        category: e.category,
        scope: e.scope,
        unit: e.unit,
        isCustom: e.isCustom,
        displayOrder: e.displayOrder,
      })),
      equipmentMultiplier: equipmentMultiplier
        ? { targetHives: equipmentMultiplier.targetHives }
        : null,
      frameSizes: frameSizes.map((f) => ({
        id: f.id,
        name: f.name,
        width: f.width,
        height: f.height,
        depth: f.depth,
        status: f.status,
      })),
    };
  }

  private async appendFromStorage(
    archive: archiver.Archiver,
    storageKey: string,
    name: string,
  ): Promise<boolean> {
    try {
      const source = await this.storage.getObject(storageKey);
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        source.on('data', (chunk: Buffer) => chunks.push(chunk));
        source.on('end', () => resolve());
        source.on('error', reject);
      });
      archive.append(Buffer.concat(chunks), { name });
      return true;
    } catch (err) {
      this.logger.warn({
        message: 'Failed to append attachment to archive',
        storageKey,
        error: (err as Error).message,
      });
      return false;
    }
  }
}
