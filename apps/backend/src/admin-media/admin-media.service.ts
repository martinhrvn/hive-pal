import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileUploadService } from '../storage/file-upload.service';
import {
  AdminMediaItem,
  AdminMediaListQuery,
  AdminMediaListResponse,
  AdminMediaStatsResponse,
  AdminMediaType,
} from 'shared-schemas';

type SourceFetcher = (
  search: string | undefined,
  apiaryId: string | undefined,
  userId: string | undefined,
) => Promise<AdminMediaItem[]>;

@Injectable()
export class AdminMediaService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
  ) {}

  async list(query: AdminMediaListQuery): Promise<AdminMediaListResponse> {
    const { type, apiaryId, userId, search, page, pageSize } = query;

    const sources: Record<AdminMediaType, SourceFetcher> = {
      photo: (s, a, u) => this.fetchPhotos(s, a, u),
      document: (s, a, u) => this.fetchDocuments(s, a, u),
      'inspection-audio': (s, a, u) => this.fetchInspectionAudio(s, a, u),
      'quick-check-photo': (s, a, u) => this.fetchQuickCheckPhotos(s, a, u),
    };

    const fetchers = type ? [sources[type]] : Object.values(sources);
    const grouped = await Promise.all(
      fetchers.map((fn) => fn(search, apiaryId, userId)),
    );
    const all = grouped.flat();

    all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = all.length;
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize);

    return { items, total, page, pageSize };
  }

  async stats(): Promise<AdminMediaStatsResponse> {
    const [photos, documents, audio, quickCheckPhotos] = await Promise.all([
      this.prisma.photo.aggregate({
        _count: { _all: true },
        _sum: { fileSize: true },
      }),
      this.prisma.document.aggregate({
        _count: { _all: true },
        _sum: { fileSize: true },
      }),
      this.prisma.inspectionAudio.aggregate({
        _count: { _all: true },
        _sum: { fileSize: true },
      }),
      this.prisma.quickCheckPhoto.aggregate({
        _count: { _all: true },
        _sum: { fileSize: true },
      }),
    ]);

    const byType = [
      {
        type: 'photo' as const,
        count: photos._count._all,
        totalSize: photos._sum.fileSize ?? 0,
      },
      {
        type: 'document' as const,
        count: documents._count._all,
        totalSize: documents._sum.fileSize ?? 0,
      },
      {
        type: 'inspection-audio' as const,
        count: audio._count._all,
        totalSize: audio._sum.fileSize ?? 0,
      },
      {
        type: 'quick-check-photo' as const,
        count: quickCheckPhotos._count._all,
        totalSize: quickCheckPhotos._sum.fileSize ?? 0,
      },
    ];

    return {
      totalCount: byType.reduce((acc, b) => acc + b.count, 0),
      totalSize: byType.reduce((acc, b) => acc + b.totalSize, 0),
      byType,
    };
  }

  async getDownloadUrl(
    type: AdminMediaType,
    id: string,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    const storageKey = await this.findStorageKey(type, id);
    if (!storageKey) {
      throw new NotFoundException(`${type} with id ${id} not found`);
    }
    return this.fileUpload.getDownloadUrl(storageKey);
  }

  private async findStorageKey(
    type: AdminMediaType,
    id: string,
  ): Promise<string | null> {
    switch (type) {
      case 'photo': {
        const row = await this.prisma.photo.findUnique({
          where: { id },
          select: { storageKey: true },
        });
        return row?.storageKey ?? null;
      }
      case 'document': {
        const row = await this.prisma.document.findUnique({
          where: { id },
          select: { storageKey: true },
        });
        return row?.storageKey ?? null;
      }
      case 'inspection-audio': {
        const row = await this.prisma.inspectionAudio.findUnique({
          where: { id },
          select: { storageKey: true },
        });
        return row?.storageKey ?? null;
      }
      case 'quick-check-photo': {
        const row = await this.prisma.quickCheckPhoto.findUnique({
          where: { id },
          select: { storageKey: true },
        });
        return row?.storageKey ?? null;
      }
      default:
        return null;
    }
  }

  private async fetchPhotos(
    search: string | undefined,
    apiaryId: string | undefined,
    userId: string | undefined,
  ): Promise<AdminMediaItem[]> {
    const rows = await this.prisma.photo.findMany({
      where: {
        ...(apiaryId && { apiaryId }),
        ...(userId && { apiary: { userId } }),
        ...(search && {
          OR: [
            { fileName: { contains: search, mode: 'insensitive' as const } },
            { caption: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      },
      include: {
        apiary: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      type: 'photo',
      fileName: p.fileName,
      mimeType: p.mimeType,
      fileSize: p.fileSize,
      storageKey: p.storageKey,
      createdAt: p.createdAt.toISOString(),
      apiaryId: p.apiaryId,
      apiaryName: p.apiary?.name ?? null,
      ownerUserId: p.apiary?.user?.id ?? null,
      ownerEmail: p.apiary?.user?.email ?? null,
      hiveId: p.hiveId,
      inspectionId: p.inspectionId,
      quickCheckId: null,
      caption: p.caption,
    }));
  }

  private async fetchDocuments(
    search: string | undefined,
    apiaryId: string | undefined,
    userId: string | undefined,
  ): Promise<AdminMediaItem[]> {
    const rows = await this.prisma.document.findMany({
      where: {
        ...(apiaryId && { apiaryId }),
        ...(userId && { apiary: { userId } }),
        ...(search && {
          OR: [
            { fileName: { contains: search, mode: 'insensitive' as const } },
            { title: { contains: search, mode: 'insensitive' as const } },
            { notes: { contains: search, mode: 'insensitive' as const } },
          ],
        }),
      },
      include: {
        apiary: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
    });
    return rows.map((d) => ({
      id: d.id,
      type: 'document',
      fileName: d.fileName,
      mimeType: d.mimeType,
      fileSize: d.fileSize,
      storageKey: d.storageKey,
      createdAt: d.createdAt.toISOString(),
      apiaryId: d.apiaryId,
      apiaryName: d.apiary?.name ?? null,
      ownerUserId: d.apiary?.user?.id ?? null,
      ownerEmail: d.apiary?.user?.email ?? null,
      hiveId: d.hiveId,
      inspectionId: null,
      quickCheckId: null,
      caption: d.title,
    }));
  }

  private async fetchInspectionAudio(
    search: string | undefined,
    apiaryId: string | undefined,
    userId: string | undefined,
  ): Promise<AdminMediaItem[]> {
    const rows = await this.prisma.inspectionAudio.findMany({
      where: {
        ...(search && {
          fileName: { contains: search, mode: 'insensitive' as const },
        }),
        ...((apiaryId || userId) && {
          inspection: {
            hive: {
              apiary: {
                ...(apiaryId && { id: apiaryId }),
                ...(userId && { userId }),
              },
            },
          },
        }),
      },
      include: {
        inspection: {
          select: {
            id: true,
            hive: {
              select: {
                id: true,
                apiary: {
                  select: {
                    id: true,
                    name: true,
                    user: { select: { id: true, email: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    return rows.map((a) => ({
      id: a.id,
      type: 'inspection-audio',
      fileName: a.fileName,
      mimeType: a.mimeType,
      fileSize: a.fileSize,
      storageKey: a.storageKey,
      createdAt: a.createdAt.toISOString(),
      apiaryId: a.inspection?.hive?.apiary?.id ?? null,
      apiaryName: a.inspection?.hive?.apiary?.name ?? null,
      ownerUserId: a.inspection?.hive?.apiary?.user?.id ?? null,
      ownerEmail: a.inspection?.hive?.apiary?.user?.email ?? null,
      hiveId: a.inspection?.hive?.id ?? null,
      inspectionId: a.inspectionId,
      quickCheckId: null,
      caption: null,
    }));
  }

  private async fetchQuickCheckPhotos(
    search: string | undefined,
    apiaryId: string | undefined,
    userId: string | undefined,
  ): Promise<AdminMediaItem[]> {
    const rows = await this.prisma.quickCheckPhoto.findMany({
      where: {
        ...(search && {
          fileName: { contains: search, mode: 'insensitive' as const },
        }),
        ...((apiaryId || userId) && {
          quickCheck: {
            apiary: {
              ...(apiaryId && { id: apiaryId }),
              ...(userId && { userId }),
            },
          },
        }),
      },
      include: {
        quickCheck: {
          select: {
            id: true,
            hiveId: true,
            apiary: {
              select: {
                id: true,
                name: true,
                user: { select: { id: true, email: true } },
              },
            },
          },
        },
      },
    });
    return rows.map((p) => ({
      id: p.id,
      type: 'quick-check-photo',
      fileName: p.fileName,
      mimeType: p.mimeType,
      fileSize: p.fileSize,
      storageKey: p.storageKey,
      createdAt: p.createdAt.toISOString(),
      apiaryId: p.quickCheck?.apiary?.id ?? null,
      apiaryName: p.quickCheck?.apiary?.name ?? null,
      ownerUserId: p.quickCheck?.apiary?.user?.id ?? null,
      ownerEmail: p.quickCheck?.apiary?.user?.email ?? null,
      hiveId: p.quickCheck?.hiveId ?? null,
      inspectionId: null,
      quickCheckId: p.quickCheckId,
      caption: null,
    }));
  }
}
