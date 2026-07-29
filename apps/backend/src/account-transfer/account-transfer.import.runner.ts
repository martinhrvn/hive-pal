import { Injectable } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { pipeline } from 'node:stream/promises';
import { promisify } from 'node:util';
import yauzl from 'yauzl';
import {
  exportEnvelopeSchema,
  ExportEnvelope,
  ImportSummary,
} from 'shared-schemas';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.interface';
import { AccountTransferService } from './account-transfer.service';

const openZip = promisify(yauzl.open) as (
  path: string,
  options: yauzl.Options,
) => Promise<yauzl.ZipFile>;

interface ExtractedZip {
  dir: string;
  dataJson: string;
  attachmentExists: (kind: string, id: string) => string | null;
  cleanup: () => Promise<void>;
}

@Injectable()
export class AccountTransferImportRunner {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly logger: CustomLoggerService,
    private readonly jobs: AccountTransferService,
  ) {
    this.logger.setContext('AccountTransferImportRunner');
  }

  async run(jobId: string, userId: string): Promise<void> {
    let extracted: ExtractedZip | null = null;
    try {
      await this.jobs.markRunning(jobId);

      const job = await this.prisma.accountTransferJob.findUniqueOrThrow({
        where: { id: jobId },
      });
      if (!job.inputStorageKey) {
        throw new Error('Import job has no input file');
      }

      await this.jobs.setProgress(jobId, 'Reading uploaded file');
      extracted = await this.extractZip(job.inputStorageKey);

      const rawJson = await fs.readFile(
        path.join(extracted.dir, extracted.dataJson),
        'utf-8',
      );
      const parsed: unknown = JSON.parse(rawJson);
      const envelope = exportEnvelopeSchema.parse(parsed);

      this.validateVersion(envelope.version);

      const summary: ImportSummary = {
        apiariesImported: 0,
        apiariesFailed: [],
        hivesImported: 0,
        inspectionsImported: 0,
        actionsImported: 0,
        photosImported: 0,
        photosMissing: 0,
        documentsImported: 0,
        documentsMissing: 0,
        audioImported: 0,
        audioMissing: 0,
        membersLinked: 0,
        membersDropped: 0,
        equipmentItemsImported: 0,
        frameSizesImported: 0,
        warnings: [],
      };

      for (let i = 0; i < envelope.apiaries.length; i++) {
        const a = envelope.apiaries[i];
        await this.jobs.setProgress(
          jobId,
          `Importing apiary ${i + 1} of ${envelope.apiaries.length} (${a.name})`,
        );
        try {
          await this.importApiary(userId, a, extracted, summary);
          summary.apiariesImported++;
        } catch (err) {
          const msg = (err as Error).message;
          summary.apiariesFailed.push(`${a.name}: ${msg}`);
          summary.warnings.push(`Apiary "${a.name}" failed to import: ${msg}`);
          this.logger.warn({
            message: 'Apiary import failed',
            apiaryName: a.name,
            error: msg,
          });
        }
      }

      await this.jobs.setProgress(jobId, 'Importing user settings');
      await this.importUserConfig(userId, envelope.userConfig, summary);

      // delete the uploaded ZIP
      try {
        await this.storage.deleteObject(job.inputStorageKey);
        await this.prisma.accountTransferJob.update({
          where: { id: jobId },
          data: { inputStorageKey: null },
        });
      } catch (err) {
        this.logger.warn({
          message: 'Failed to clean up uploaded import file',
          error: (err as Error).message,
        });
      }

      await this.jobs.markCompleted(jobId, { summary });

      this.logger.log({
        message: 'Import job completed',
        jobId,
        userId,
        summary,
      });
    } catch (err) {
      const message = (err as Error).message ?? 'Unknown error';
      this.logger.error({
        message: 'Import job failed',
        jobId,
        userId,
        error: message,
        stack: (err as Error).stack,
      });
      await this.jobs.markFailed(jobId, message);
    } finally {
      if (extracted) {
        await extracted.cleanup();
      }
    }
  }

  private validateVersion(version: string): void {
    const major = version.split('.')[0];
    if (major !== '1') {
      throw new Error(
        `Unsupported export version ${version}; this instance supports v1.x`,
      );
    }
  }

  private async extractZip(inputKey: string): Promise<ExtractedZip> {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'account-import-'));
    const zipPath = path.join(dir, 'input.zip');

    const stream = await this.storage.getObject(inputKey);
    await pipeline(stream, createWriteStream(zipPath));

    const zipFile = await openZip(zipPath, { lazyEntries: true });
    let dataJsonEntry: string | null = null;
    const attachmentMap = new Map<string, string>();

    await new Promise<void>((resolve, reject) => {
      zipFile.on('entry', (entry: yauzl.Entry) => {
        const safeName = entry.fileName;
        if (safeName.includes('..') || safeName.startsWith('/')) {
          reject(new Error(`Unsafe path in archive: ${safeName}`));
          return;
        }
        if (safeName.endsWith('/')) {
          zipFile.readEntry();
          return;
        }
        const targetPath = path.join(dir, safeName);
        if (!targetPath.startsWith(dir + path.sep)) {
          reject(new Error(`Unsafe path in archive: ${safeName}`));
          return;
        }
        fs.mkdir(path.dirname(targetPath), { recursive: true })
          .then(
            () =>
              new Promise<void>((res, rej) => {
                zipFile.openReadStream(entry, (err, readStream) => {
                  if (err || !readStream) {
                    rej(err ?? new Error('Empty read stream from archive'));
                    return;
                  }
                  const writeStream = createWriteStream(targetPath);
                  readStream.pipe(writeStream);
                  writeStream.on('close', () => res());
                  writeStream.on('error', rej);
                });
              }),
          )
          .then(() => {
            if (safeName === 'data.json') {
              dataJsonEntry = safeName;
            } else if (safeName.startsWith('attachments/')) {
              const rel = safeName.slice('attachments/'.length);
              const slash = rel.indexOf('/');
              if (slash > 0) {
                const kind = rel.slice(0, slash);
                const filename = rel.slice(slash + 1);
                const id = filename.replace(/\.[^.]+$/, '');
                attachmentMap.set(`${kind}/${id}`, targetPath);
              }
            }
            zipFile.readEntry();
          })
          .catch(reject);
      });
      zipFile.on('end', () => resolve());
      zipFile.on('error', reject);
      zipFile.readEntry();
    });

    if (!dataJsonEntry) {
      throw new Error('data.json not found in archive');
    }

    return {
      dir,
      dataJson: dataJsonEntry,
      attachmentExists: (kind, id) =>
        attachmentMap.get(`${kind}/${id}`) ?? null,
      cleanup: async () => {
        try {
          await fs.rm(dir, { recursive: true, force: true });
        } catch {
          // ignore
        }
      },
    };
  }

  private async importApiary(
    userId: string,
    a: ExportEnvelope['apiaries'][number],
    extracted: ExtractedZip,
    summary: ImportSummary,
  ): Promise<void> {
    const hiveIdMap = new Map<string, string>();
    const inspectionIdMap = new Map<string, string>();
    const actionIdMap = new Map<string, string>();
    const harvestIdMap = new Map<string, string>();
    const queenIdMap = new Map<string, string>();
    const batchInspectionIdMap = new Map<string, string>();
    const photoIdMap = new Map<string, string>();

    // Pre-upload attachments outside of transaction (storage I/O)
    const photoUploads = new Map<
      string,
      { newKey: string; fileName: string }
    >();
    for (const p of a.photos) {
      const local = extracted.attachmentExists('photos', p.id);
      if (!local) {
        summary.photosMissing++;
        summary.warnings.push(`Missing photo file for ${p.fileName}`);
        continue;
      }
      const newId = crypto.randomUUID();
      const newKey = `photos/${newId}/${p.fileName}`;
      const buf = await fs.readFile(local);
      await this.storage.uploadObject(newKey, buf, p.mimeType);
      photoUploads.set(p.id, { newKey, fileName: p.fileName });
    }

    const documentUploads = new Map<
      string,
      { newKey: string; fileName: string }
    >();
    for (const d of a.documents) {
      const local = extracted.attachmentExists('documents', d.id);
      if (!local) {
        summary.documentsMissing++;
        summary.warnings.push(`Missing document file for ${d.fileName}`);
        continue;
      }
      const newId = crypto.randomUUID();
      const newKey = `documents/${newId}/${d.fileName}`;
      const buf = await fs.readFile(local);
      await this.storage.uploadObject(newKey, buf, d.mimeType);
      documentUploads.set(d.id, { newKey, fileName: d.fileName });
    }

    const audioUploads = new Map<
      string,
      { newKey: string; fileName: string }
    >();
    const quickCheckPhotoUploads = new Map<
      string,
      { newKey: string; fileName: string }
    >();
    for (const h of a.hives) {
      for (const i of h.inspections) {
        for (const audio of i.audioRecordings) {
          const local = extracted.attachmentExists('audio', audio.id);
          if (!local) {
            summary.audioMissing++;
            summary.warnings.push(`Missing audio file for ${audio.fileName}`);
            continue;
          }
          const newId = crypto.randomUUID();
          const newKey = `audio/${newId}/${audio.fileName}`;
          const buf = await fs.readFile(local);
          await this.storage.uploadObject(newKey, buf, audio.mimeType);
          audioUploads.set(audio.id, { newKey, fileName: audio.fileName });
        }
      }
    }
    for (const qc of a.quickChecks) {
      for (const photo of qc.photos) {
        const local = extracted.attachmentExists(
          'quick-check-photos',
          photo.id,
        );
        if (!local) {
          summary.photosMissing++;
          summary.warnings.push(`Missing quick check photo ${photo.fileName}`);
          continue;
        }
        const newId = crypto.randomUUID();
        const newKey = `quick-check-photos/${newId}/${photo.fileName}`;
        const buf = await fs.readFile(local);
        await this.storage.uploadObject(newKey, buf, photo.mimeType);
        quickCheckPhotoUploads.set(photo.id, {
          newKey,
          fileName: photo.fileName,
        });
      }
    }

    await this.prisma.$transaction(
      async (tx) => {
        const importDate = new Date().toISOString().slice(0, 10);
        const apiary = await tx.apiary.create({
          data: {
            name: `${a.name} (Imported on ${importDate})`,
            location: a.location ?? null,
            latitude: a.latitude ?? null,
            longitude: a.longitude ?? null,
            notes: a.notes ?? null,
            settings: (a.settings ?? null) as never,
            userId,
          },
        });

        // Hives
        for (const h of a.hives) {
          const newHive = await tx.hive.create({
            data: {
              apiaryId: apiary.id,
              name: h.name,
              notes: h.notes ?? null,
              status: h.status as never,
              installationDate: h.installationDate
                ? new Date(h.installationDate)
                : null,
              positionRow: h.positionRow ?? null,
              positionCol: h.positionCol ?? null,
              settings: (h.settings ?? null) as never,
            },
          });
          hiveIdMap.set(h.id, newHive.id);

          for (const b of h.boxes) {
            await tx.box.create({
              data: {
                hiveId: newHive.id,
                position: b.position,
                frameCount: b.frameCount,
                maxFrameCount: b.maxFrameCount ?? 10,
                hasExcluder: b.hasExcluder ?? false,
                type: b.type as never,
                variant: (b.variant as never) ?? null,
                color: b.color ?? null,
                lastSanitized: b.lastSanitized
                  ? new Date(b.lastSanitized)
                  : null,
                addedAt: b.addedAt ? new Date(b.addedAt) : new Date(),
                winterized: b.winterized ?? false,
                // frameSizeId intentionally dropped (per-user catalog)
              },
            });
          }
        }

        // Inspections (without action FK yet)
        for (const h of a.hives) {
          const newHiveId = hiveIdMap.get(h.id)!;
          for (const i of h.inspections) {
            const newIns = await tx.inspection.create({
              data: {
                hiveId: newHiveId,
                date: new Date(i.date),
                isAllDay: i.isAllDay ?? true,
                temperature: i.temperature ?? null,
                weatherConditions: i.weatherConditions ?? null,
                status: i.status as never,
                overallScore: i.overallScore ?? null,
                populationScore: i.populationScore ?? null,
                storesScore: i.storesScore ?? null,
                queenScore: i.queenScore ?? null,
                scoreWarnings: i.scoreWarnings ?? null,
                scoreConfidence: i.scoreConfidence ?? null,
                createdByUserId: userId,
              },
            });
            inspectionIdMap.set(i.id, newIns.id);
            summary.inspectionsImported++;

            for (const n of i.notes) {
              await tx.inspectionNote.create({
                data: { inspectionId: newIns.id, text: n.text },
              });
            }
            for (const o of i.observations) {
              await tx.observation.create({
                data: {
                  inspectionId: newIns.id,
                  type: o.type,
                  numericValue: o.numericValue ?? null,
                  textValue: o.textValue ?? null,
                  booleanValue: o.booleanValue ?? null,
                  notes: o.notes ?? null,
                },
              });
            }
            for (const audio of i.audioRecordings) {
              const upload = audioUploads.get(audio.id);
              if (!upload) continue;
              await tx.inspectionAudio.create({
                data: {
                  inspectionId: newIns.id,
                  storageKey: upload.newKey,
                  fileName: audio.fileName,
                  mimeType: audio.mimeType,
                  fileSize: audio.fileSize,
                  duration: audio.duration ?? null,
                  transcription: audio.transcription ?? null,
                  transcriptionStatus: (audio.transcriptionStatus ??
                    'NONE') as never,
                  analysisStatus: (audio.analysisStatus ?? 'NONE') as never,
                  analysisResult: (audio.analysisResult ?? null) as never,
                },
              });
              summary.audioImported++;
            }
          }
        }

        // Queens + movements (intra-apiary FKs)
        for (const h of a.hives) {
          const newHiveId = hiveIdMap.get(h.id)!;
          for (const q of h.queens) {
            const newQueen = await tx.queen.create({
              data: {
                hiveId: newHiveId,
                name: q.name ?? null,
                marking: q.marking ?? null,
                color: q.color ?? null,
                year: q.year ?? null,
                source: q.source ?? null,
                status: q.status as never,
                installedAt: q.installedAt ? new Date(q.installedAt) : null,
                replacedAt: q.replacedAt ? new Date(q.replacedAt) : null,
              },
            });
            queenIdMap.set(q.id, newQueen.id);
            for (const m of q.movements) {
              await tx.queenMovement.create({
                data: {
                  queenId: newQueen.id,
                  fromHiveId: m.fromHiveId
                    ? (hiveIdMap.get(m.fromHiveId) ?? null)
                    : null,
                  toHiveId: m.toHiveId
                    ? (hiveIdMap.get(m.toHiveId) ?? null)
                    : null,
                  movedAt: new Date(m.movedAt),
                  reason: m.reason ?? null,
                  notes: m.notes ?? null,
                },
              });
            }
          }
        }

        // Harvests
        for (const h of a.harvests) {
          const newHarvest = await tx.harvest.create({
            data: {
              apiaryId: apiary.id,
              date: new Date(h.date),
              status: h.status as never,
              totalWeight: h.totalWeight ?? null,
              totalWeightUnit: h.totalWeightUnit ?? 'kg',
              notes: h.notes ?? null,
            },
          });
          harvestIdMap.set(h.id, newHarvest.id);
          for (const hh of h.harvestHives) {
            const hiveNew = hiveIdMap.get(hh.hiveId);
            if (!hiveNew) continue;
            await tx.harvestHive.create({
              data: {
                harvestId: newHarvest.id,
                hiveId: hiveNew,
                framesTaken: hh.framesTaken,
                honeyAmount: hh.honeyAmount ?? null,
                honeyAmountUnit: hh.honeyAmountUnit ?? 'kg',
                honeyPercentage: hh.honeyPercentage ?? null,
              },
            });
          }
        }

        // Actions + subtype rows
        for (const h of a.hives) {
          const newHiveId = hiveIdMap.get(h.id);
          for (const action of h.actions) {
            const newAction = await tx.action.create({
              data: {
                hiveId: newHiveId ?? null,
                inspectionId: action.inspectionId
                  ? (inspectionIdMap.get(action.inspectionId) ?? null)
                  : null,
                harvestId: action.harvestId
                  ? (harvestIdMap.get(action.harvestId) ?? null)
                  : null,
                type: action.type as never,
                notes: action.notes ?? null,
                date: new Date(action.date),
                createdByUserId: userId,
              },
            });
            actionIdMap.set(action.id, newAction.id);
            summary.actionsImported++;

            const details = action.details;
            if (details) {
              await this.createActionSubtype(tx, newAction.id, details);
            }
          }
        }

        // Batch inspections
        for (const b of a.batchInspections) {
          const newBatch = await tx.batchInspection.create({
            data: {
              apiaryId: apiary.id,
              name: b.name,
              status: b.status as never,
              startedAt: b.startedAt ? new Date(b.startedAt) : null,
              completedAt: b.completedAt ? new Date(b.completedAt) : null,
            },
          });
          batchInspectionIdMap.set(b.id, newBatch.id);
          for (const bh of b.hives) {
            const hiveNew = hiveIdMap.get(bh.hiveId);
            if (!hiveNew) continue;
            await tx.batchInspectionHive.create({
              data: {
                batchInspectionId: newBatch.id,
                hiveId: hiveNew,
                order: bh.order,
                status: bh.status as never,
                inspectionId: bh.inspectionId
                  ? (inspectionIdMap.get(bh.inspectionId) ?? null)
                  : null,
                completedAt: bh.completedAt ? new Date(bh.completedAt) : null,
                skippedCount: bh.skippedCount ?? 0,
              },
            });
          }
        }

        // Quick checks
        for (const qc of a.quickChecks) {
          const newQc = await tx.quickCheck.create({
            data: {
              apiaryId: apiary.id,
              hiveId: qc.hiveId ? (hiveIdMap.get(qc.hiveId) ?? null) : null,
              date: new Date(qc.date),
              note: qc.note ?? null,
              tags: qc.tags,
              createdByUserId: userId,
            },
          });
          for (const photo of qc.photos) {
            const upload = quickCheckPhotoUploads.get(photo.id);
            if (!upload) continue;
            await tx.quickCheckPhoto.create({
              data: {
                quickCheckId: newQc.id,
                storageKey: upload.newKey,
                fileName: photo.fileName,
                mimeType: photo.mimeType,
                fileSize: photo.fileSize,
              },
            });
          }
        }

        // Photos
        let apiaryFeaturePhotoNewId: string | null = null;
        for (const p of a.photos) {
          const upload = photoUploads.get(p.id);
          if (!upload) continue;
          const newPhoto = await tx.photo.create({
            data: {
              apiaryId: apiary.id,
              hiveId: p.hiveId ? (hiveIdMap.get(p.hiveId) ?? null) : null,
              inspectionId: p.inspectionId
                ? (inspectionIdMap.get(p.inspectionId) ?? null)
                : null,
              caption: p.caption ?? null,
              storageKey: upload.newKey,
              fileName: p.fileName,
              mimeType: p.mimeType,
              fileSize: p.fileSize,
              date: new Date(p.date),
            },
          });
          photoIdMap.set(p.id, newPhoto.id);
          summary.photosImported++;
          if (p.isFeatureOfApiary) {
            apiaryFeaturePhotoNewId = newPhoto.id;
          }
        }
        if (apiaryFeaturePhotoNewId) {
          await tx.apiary.update({
            where: { id: apiary.id },
            data: { featurePhotoId: apiaryFeaturePhotoNewId },
          });
        }

        // Documents
        for (const d of a.documents) {
          const upload = documentUploads.get(d.id);
          if (!upload) continue;
          await tx.document.create({
            data: {
              apiaryId: apiary.id,
              hiveId: d.hiveId ? (hiveIdMap.get(d.hiveId) ?? null) : null,
              title: d.title,
              notes: d.notes ?? null,
              storageKey: upload.newKey,
              fileName: d.fileName,
              mimeType: d.mimeType,
              fileSize: d.fileSize,
              date: new Date(d.date),
            },
          });
          summary.documentsImported++;
        }

        summary.hivesImported += a.hives.length;

        // Members: best-effort re-link
        for (const m of a.members) {
          if (m.role === 'OWNER') continue;
          const target = await tx.user.findUnique({
            where: { email: m.email.toLowerCase() },
            select: { id: true },
          });
          if (!target || target.id === userId) {
            summary.membersDropped++;
            summary.warnings.push(`Member ${m.email} not found; skipped`);
            continue;
          }
          await tx.apiaryMember.create({
            data: {
              apiaryId: apiary.id,
              userId: target.id,
              role: m.role as never,
              status: 'ACTIVE',
            },
          });
          summary.membersLinked++;
        }
      },
      { timeout: 120_000, maxWait: 10_000 },
    );
  }

  private async createActionSubtype(
    tx: Parameters<Parameters<PrismaService['$transaction']>[0]>[0],
    actionId: string,
    details: { kind: string; data: Record<string, unknown> },
  ): Promise<void> {
    const d = details.data;
    const str = (v: unknown, fallback = ''): string =>
      typeof v === 'string' ? v : typeof v === 'number' ? String(v) : fallback;
    const num = (v: unknown, fallback = 0): number =>
      typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : fallback;
    const strOrNull = (v: unknown): string | null =>
      typeof v === 'string' && v.length > 0 ? v : null;
    const numOrNull = (v: unknown): number | null =>
      typeof v === 'number' && Number.isFinite(v) ? v : null;

    switch (details.kind) {
      case 'FEEDING':
        await tx.feedingAction.create({
          data: {
            actionId,
            feedType: str(d.feedType),
            amount: num(d.amount),
            unit: str(d.unit),
            concentration: strOrNull(d.concentration),
            // v2 fields (nullable) — carried through so an export/import
            // round-trip keeps density-aware records intact.
            feedTypeId: strOrNull(d.feedTypeId),
            enteredAmount: numOrNull(d.enteredAmount),
            enteredUnit: strOrNull(d.enteredUnit),
            amountG: numOrNull(d.amountG),
            density: numOrNull(d.density),
            sugarContent: numOrNull(d.sugarContent),
            sugarG: numOrNull(d.sugarG),
            waterAddedMl: numOrNull(d.waterAddedMl),
          },
        });
        break;
      case 'TREATMENT':
        await tx.treatmentAction.create({
          data: {
            actionId,
            product: str(d.product),
            quantity:
              d.quantity === undefined || d.quantity === null
                ? null
                : num(d.quantity),
            unit: str(d.unit),
            duration: strOrNull(d.duration),
          },
        });
        break;
      case 'FRAME':
        await tx.frameAction.create({
          data: { actionId, quantity: num(d.quantity) },
        });
        break;
      case 'HARVEST':
        await tx.harvestAction.create({
          data: {
            actionId,
            amount: num(d.amount),
            unit: str(d.unit, 'kg'),
          },
        });
        break;
      case 'BOX_CONFIGURATION':
        await tx.boxConfigurationAction.create({
          data: {
            actionId,
            boxesAdded: num(d.boxesAdded),
            boxesRemoved: num(d.boxesRemoved),
            framesAdded: num(d.framesAdded),
            framesRemoved: num(d.framesRemoved),
            totalBoxes: num(d.totalBoxes),
            totalFrames: num(d.totalFrames),
            boxes: (d.boxes ?? null) as never,
          },
        });
        break;
      case 'MAINTENANCE':
        await tx.maintenanceAction.create({
          data: {
            actionId,
            component: str(d.component),
            status: str(d.status),
          },
        });
        break;
    }
  }

  private async importUserConfig(
    userId: string,
    cfg: ExportEnvelope['userConfig'],
    summary: ImportSummary,
  ): Promise<void> {
    for (const f of cfg.feedTypes ?? []) {
      try {
        await this.prisma.userFeedType.upsert({
          where: { userId_label: { userId, label: f.label } },
          create: {
            userId,
            label: f.label,
            form: f.form,
            density: f.density ?? null,
            sugarContent: f.sugarContent,
            archived: f.archived ?? false,
          },
          update: {},
        });
      } catch (err) {
        summary.warnings.push(
          `Feed type "${f.label}" failed to import: ${(err as Error).message}`,
        );
      }
    }

    for (const e of cfg.equipmentItems ?? []) {
      try {
        await this.prisma.equipmentItem.upsert({
          where: { userId_itemId: { userId, itemId: e.itemId } },
          create: {
            userId,
            itemId: e.itemId,
            name: e.name ?? null,
            enabled: e.enabled ?? true,
            perHive: e.perHive ?? 0,
            extra: e.extra ?? 0,
            inExtraction: e.inExtraction ?? 0,
            damaged: e.damaged ?? 0,
            neededOverride: e.neededOverride ?? null,
            category: e.category as never,
            scope: (e.scope as never) ?? 'PER_HIVE',
            unit: e.unit ?? 'pieces',
            isCustom: e.isCustom ?? false,
            displayOrder: e.displayOrder ?? 999,
          },
          update: {},
        });
        summary.equipmentItemsImported++;
      } catch (err) {
        summary.warnings.push(
          `Failed to import equipment item ${e.itemId}: ${(err as Error).message}`,
        );
      }
    }
    if (cfg.equipmentMultiplier) {
      try {
        await this.prisma.equipmentMultiplier.upsert({
          where: { userId },
          create: { userId, targetHives: cfg.equipmentMultiplier.targetHives },
          update: { targetHives: cfg.equipmentMultiplier.targetHives },
        });
      } catch {
        // ignore
      }
    }
    for (const f of cfg.frameSizes ?? []) {
      try {
        const existing = await this.prisma.frameSize.findUnique({
          where: { name: f.name },
        });
        if (existing) continue;
        await this.prisma.frameSize.create({
          data: {
            name: f.name,
            width: f.width,
            height: f.height,
            depth: f.depth,
            status: 'PENDING' as never,
            createdByUserId: userId,
          },
        });
        summary.frameSizesImported++;
      } catch (err) {
        summary.warnings.push(
          `Failed to import frame size ${f.name}: ${(err as Error).message}`,
        );
      }
    }
  }
}
