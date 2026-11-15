import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import { vi } from 'vitest';
import yauzl from 'yauzl';
import type { PrismaService } from '../prisma/prisma.service';
import type { CustomLoggerService } from '../logger/logger.service';
import { StorageService } from '../storage/storage.interface';
import { AccountTransferExportRunner } from './account-transfer.export.runner';
import type { AccountTransferService } from './account-transfer.service';

const ZIP_STORE = 0;
const ZIP_DEFLATE = 8;

interface PhotoRow {
  id: string;
  fileName: string;
  mimeType: string;
  storageKey: string;
}

const photo = (id: string, mimeType = 'image/jpeg'): PhotoRow => ({
  id,
  fileName: `${id}.jpg`,
  mimeType,
  storageKey: `photos/${id}`,
});

const none = {
  findMany: () => Promise.resolve([]),
  findUnique: () => Promise.resolve(null),
};

function fakePrisma(photos: PhotoRow[]): PrismaService {
  return {
    user: { findUnique: () => Promise.resolve({ email: 'bee@example.com' }) },
    apiary: {
      findMany: () => Promise.resolve([{ id: 'apiary-1', name: 'Home' }]),
      findUniqueOrThrow: () =>
        Promise.resolve({ id: 'apiary-1', name: 'Home', featurePhotoId: null }),
    },
    photo: {
      findMany: () =>
        Promise.resolve(
          photos.map((p) => ({
            ...p,
            hiveId: null,
            inspectionId: null,
            caption: null,
            fileSize: 1,
            date: new Date('2026-05-01'),
          })),
        ),
    },
    hive: none,
    harvest: none,
    batchInspection: none,
    quickCheck: none,
    document: none,
    apiaryMember: none,
    equipmentItem: none,
    equipmentMultiplier: none,
    frameSize: none,
    userFeedType: none,
  } as unknown as PrismaService;
}

class FakeStorage extends StorageService {
  uploaded: Buffer | null = null;
  deleted: string[] = [];

  constructor(private readonly missing = new Set<string>()) {
    super();
  }
  isEnabled() {
    return true;
  }
  getObject(key: string) {
    if (this.missing.has(key)) {
      return Promise.reject(new Error('NoSuchKey'));
    }
    return Promise.resolve(Readable.from([Buffer.from(`bytes of ${key}`)]));
  }
  async uploadStream(_key: string, stream: Readable) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    this.uploaded = Buffer.concat(chunks);
  }
  deleteObject(key: string) {
    this.deleted.push(key);
    return Promise.resolve();
  }
  statObject = () => Promise.resolve(null);
  uploadObject = () => Promise.resolve();
  generateUploadUrl = () => Promise.resolve('');
  generateDownloadUrl = () => Promise.resolve('');
  deleteObjects = () => Promise.resolve();
}

function fakeJobs() {
  return {
    markRunning: vi.fn().mockResolvedValue(undefined),
    setProgress: vi.fn().mockResolvedValue(true),
    markCompleted: vi.fn().mockResolvedValue(true),
    markFailed: vi.fn().mockResolvedValue(undefined),
  };
}

const logger = {
  setContext: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as CustomLoggerService;

function makeRunner(
  photos: PhotoRow[],
  storage: FakeStorage,
  jobs: ReturnType<typeof fakeJobs>,
) {
  return new AccountTransferExportRunner(
    fakePrisma(photos),
    storage,
    logger,
    jobs as unknown as AccountTransferService,
    { get: () => undefined } as unknown as ConfigService,
  );
}

interface ZipEntryInfo {
  name: string;
  compressionMethod: number;
}

function listEntries(zip: Buffer): Promise<ZipEntryInfo[]> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(zip, { lazyEntries: true }, (err, zipFile) => {
      if (err) return reject(err);
      const entries: ZipEntryInfo[] = [];
      zipFile.on('entry', (entry: yauzl.Entry) => {
        entries.push({
          name: entry.fileName,
          compressionMethod: entry.compressionMethod,
        });
        zipFile.readEntry();
      });
      zipFile.on('end', () => resolve(entries));
      zipFile.on('error', reject);
      zipFile.readEntry();
    });
  });
}

describe('AccountTransferExportRunner', () => {
  it('stores media as-is, deflates data.json and keeps attachment order', async () => {
    const storage = new FakeStorage();
    const jobs = fakeJobs();
    const photos = Array.from({ length: 7 }, (_, i) => photo(`p${i}`));
    photos.push(photo('scan', 'image/tiff'));

    await makeRunner(photos, storage, jobs).run('job-1', 'user-1');

    expect(jobs.markFailed).not.toHaveBeenCalled();
    expect(jobs.markCompleted).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        summary: expect.objectContaining({ attachmentsExported: 8 }),
      }),
    );
    const entries = await listEntries(storage.uploaded!);
    expect(entries).toEqual([
      ...photos.slice(0, 7).map((p) => ({
        name: `attachments/photos/${p.id}.jpg`,
        compressionMethod: ZIP_STORE,
      })),
      { name: 'attachments/photos/scan.jpg', compressionMethod: ZIP_DEFLATE },
      { name: 'data.json', compressionMethod: ZIP_DEFLATE },
    ]);
  });

  it('skips attachments that cannot be read', async () => {
    const storage = new FakeStorage(new Set(['photos/gone']));
    const jobs = fakeJobs();

    await makeRunner(
      [photo('a'), photo('gone'), photo('b')],
      storage,
      jobs,
    ).run('job-1', 'user-1');

    const entries = await listEntries(storage.uploaded!);
    expect(entries.map((e) => e.name)).toEqual([
      'attachments/photos/a.jpg',
      'attachments/photos/b.jpg',
      'data.json',
    ]);
    expect(jobs.markCompleted).toHaveBeenCalledWith(
      'job-1',
      expect.objectContaining({
        summary: expect.objectContaining({ attachmentsExported: 2 }),
      }),
    );
  });

  it('stops without uploading once the sweeper has failed the job', async () => {
    const storage = new FakeStorage();
    const jobs = fakeJobs();
    jobs.setProgress.mockResolvedValue(false);

    await makeRunner([photo('a')], storage, jobs).run('job-1', 'user-1');

    expect(storage.uploaded).toBeNull();
    expect(jobs.markCompleted).not.toHaveBeenCalled();
    expect(jobs.markFailed).not.toHaveBeenCalled();
  });

  it('deletes the upload when the job was failed while uploading', async () => {
    const storage = new FakeStorage();
    const jobs = fakeJobs();
    jobs.markCompleted.mockResolvedValue(false);

    await makeRunner([photo('a')], storage, jobs).run('job-1', 'user-1');

    expect(storage.deleted).toEqual([
      'account-transfer/exports/user-1/job-1.zip',
    ]);
    expect(jobs.markFailed).not.toHaveBeenCalled();
  });
});
