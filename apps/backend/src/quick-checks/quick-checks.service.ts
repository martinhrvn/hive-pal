import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryScopeFilter } from '../interface/request-with.apiary';
import {
  apiaryReadScope,
  apiaryWriteAccessWhere,
  apiaryWriteScope,
} from '../common';
import { v4 as uuidv4 } from 'uuid';
import {
  CreateQuickCheck,
  QuickCheckResponse,
  QuickCheckPhotoResponse,
} from 'shared-schemas';

const ALLOWED_PHOTO_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

const MAX_PHOTOS_PER_CHECK = 5;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024; // 10MB

interface QuickCheckFilterInternal {
  hiveId?: string;
  // Selected apiary (a filter); absent = every apiary the user can access.
  apiaryId?: string;
  userId: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class QuickChecksService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private logger: CustomLoggerService,
  ) {}

  async create(
    dto: CreateQuickCheck,
    filter: ApiaryScopeFilter,
  ): Promise<QuickCheckResponse> {
    // The quick check belongs to the hive's apiary when a hive is given,
    // otherwise to the selected apiary; either way it must be writable.
    let apiaryId: string;
    if (dto.hiveId) {
      const hive = await this.prisma.hive.findFirst({
        where: { id: dto.hiveId, apiary: apiaryWriteScope(filter) },
        select: { apiaryId: true },
      });

      if (!hive?.apiaryId) {
        throw new NotFoundException(
          `Hive with ID ${dto.hiveId} not found or you cannot edit its apiary`,
        );
      }
      apiaryId = hive.apiaryId;
    } else {
      // The apiary named in the body, falling back to the selected apiary.
      const targetApiaryId = dto.apiaryId ?? filter.apiaryId;
      if (!targetApiaryId) {
        throw new BadRequestException(
          'Select an apiary to create a quick check',
        );
      }
      const apiary = await this.prisma.apiary.findFirst({
        where: {
          id: targetApiaryId,
          ...apiaryWriteAccessWhere(filter.userId),
        },
        select: { id: true },
      });
      if (!apiary) {
        throw new NotFoundException(
          `Apiary with ID ${targetApiaryId} not found or you cannot edit it`,
        );
      }
      apiaryId = apiary.id;
    }

    const quickCheck = await this.prisma.quickCheck.create({
      data: {
        apiaryId,
        hiveId: dto.hiveId ?? null,
        date: dto.date ? new Date(dto.date) : new Date(),
        note: dto.note ?? null,
        tags: dto.tags ?? [],
        createdByUserId: filter.userId,
      },
      include: {
        photos: true,
        createdByUser: { select: { name: true, email: true } },
      },
    });

    this.logger.log({
      message: 'Quick check created',
      quickCheckId: quickCheck.id,
      apiaryId,
      hiveId: dto.hiveId,
      userId: filter.userId,
    });

    return this.mapToResponse(quickCheck);
  }

  async findAll(
    filter: QuickCheckFilterInternal,
  ): Promise<QuickCheckResponse[]> {
    const where: Record<string, unknown> = {
      apiary: apiaryReadScope(filter),
    };

    if (filter.hiveId) {
      where.hiveId = filter.hiveId;
    }

    if (filter.startDate || filter.endDate) {
      const dateFilter: Record<string, Date> = {};
      if (filter.startDate) dateFilter.gte = new Date(filter.startDate);
      if (filter.endDate) dateFilter.lte = new Date(filter.endDate);
      where.date = dateFilter;
    }

    const quickChecks = await this.prisma.quickCheck.findMany({
      where,
      include: {
        photos: true,
        createdByUser: { select: { name: true, email: true } },
      },
      orderBy: { date: 'desc' },
    });

    return quickChecks.map((qc) => this.mapToResponse(qc));
  }

  async findOne(
    id: string,
    filter: ApiaryScopeFilter,
  ): Promise<QuickCheckResponse> {
    const quickCheck = await this.prisma.quickCheck.findFirst({
      where: {
        id,
        apiary: apiaryReadScope(filter),
      },
      include: {
        photos: true,
        createdByUser: { select: { name: true, email: true } },
      },
    });

    if (!quickCheck) {
      throw new NotFoundException(`Quick check with ID ${id} not found`);
    }

    return this.mapToResponse(quickCheck);
  }

  async delete(id: string, filter: ApiaryScopeFilter): Promise<void> {
    const quickCheck = await this.prisma.quickCheck.findFirst({
      where: {
        id,
        apiary: apiaryWriteScope(filter),
      },
      include: { photos: { select: { storageKey: true } } },
    });

    if (!quickCheck) {
      throw new NotFoundException(`Quick check with ID ${id} not found`);
    }

    // Delete photos from S3
    if (this.storageService.isEnabled() && quickCheck.photos.length > 0) {
      try {
        await this.storageService.deleteObjects(
          quickCheck.photos.map((p) => p.storageKey),
        );
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete quick check photos from storage',
          quickCheckId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.prisma.quickCheck.delete({ where: { id } });

    this.logger.log({
      message: 'Quick check deleted',
      quickCheckId: id,
    });
  }

  async uploadPhoto(
    quickCheckId: string,
    file: Express.Multer.File,
    filter: ApiaryScopeFilter,
  ): Promise<QuickCheckPhotoResponse> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Photo upload is not available. Storage is not configured.',
      );
    }

    if (!ALLOWED_PHOTO_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid photo format. Allowed formats: ${ALLOWED_PHOTO_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_PHOTO_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${MAX_PHOTO_SIZE / 1024 / 1024}MB)`,
      );
    }

    const quickCheck = await this.prisma.quickCheck.findFirst({
      where: {
        id: quickCheckId,
        apiary: apiaryWriteScope(filter),
      },
      include: { photos: { select: { id: true } } },
    });

    if (!quickCheck) {
      throw new NotFoundException(
        `Quick check with ID ${quickCheckId} not found`,
      );
    }

    if (quickCheck.photos.length >= MAX_PHOTOS_PER_CHECK) {
      throw new BadRequestException(
        `Maximum ${MAX_PHOTOS_PER_CHECK} photos per quick check`,
      );
    }

    const photoId = uuidv4();
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const storageKey = `quick-checks/${quickCheckId}/${photoId}.${extension}`;

    await this.storageService.uploadObject(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    const photo = await this.prisma.quickCheckPhoto.create({
      data: {
        id: photoId,
        quickCheckId,
        storageKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });

    this.logger.log({
      message: 'Quick check photo uploaded',
      photoId,
      quickCheckId,
      fileSize: file.size,
    });

    return this.mapPhotoToResponse(photo);
  }

  async getPhotoDownloadUrl(
    quickCheckId: string,
    photoId: string,
    filter: ApiaryScopeFilter,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Photo download is not available. Storage is not configured.',
      );
    }

    const photo = await this.prisma.quickCheckPhoto.findFirst({
      where: {
        id: photoId,
        quickCheckId,
        quickCheck: {
          apiary: apiaryReadScope(filter),
        },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    const expiresIn = 3600;
    const downloadUrl = await this.storageService.generateDownloadUrl(
      photo.storageKey,
      expiresIn,
    );

    return { downloadUrl, expiresIn };
  }

  async deletePhoto(
    quickCheckId: string,
    photoId: string,
    filter: ApiaryScopeFilter,
  ): Promise<void> {
    const photo = await this.prisma.quickCheckPhoto.findFirst({
      where: {
        id: photoId,
        quickCheckId,
        quickCheck: {
          apiary: apiaryWriteScope(filter),
        },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    if (this.storageService.isEnabled()) {
      try {
        await this.storageService.deleteObject(photo.storageKey);
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete photo from storage',
          photoId,
          storageKey: photo.storageKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.prisma.quickCheckPhoto.delete({ where: { id: photoId } });

    this.logger.log({
      message: 'Quick check photo deleted',
      photoId,
      quickCheckId,
    });
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
    };
    return mimeToExt[mimeType] || 'jpg';
  }

  private mapToResponse(quickCheck: {
    id: string;
    hiveId: string | null;
    apiaryId: string;
    date: Date;
    note: string | null;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    createdByUser?: { name: string | null; email: string } | null;
    photos: Array<{
      id: string;
      quickCheckId: string;
      storageKey: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      createdAt: Date;
    }>;
  }): QuickCheckResponse {
    return {
      id: quickCheck.id,
      hiveId: quickCheck.hiveId,
      apiaryId: quickCheck.apiaryId,
      date: quickCheck.date.toISOString(),
      note: quickCheck.note,
      tags: quickCheck.tags,
      photos: quickCheck.photos.map((p) => this.mapPhotoToResponse(p)),
      createdAt: quickCheck.createdAt.toISOString(),
      updatedAt: quickCheck.updatedAt.toISOString(),
      createdByUserName:
        quickCheck.createdByUser?.name || quickCheck.createdByUser?.email,
    };
  }

  private mapPhotoToResponse(photo: {
    id: string;
    quickCheckId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    createdAt: Date;
  }): QuickCheckPhotoResponse {
    return {
      id: photo.id,
      quickCheckId: photo.quickCheckId,
      fileName: photo.fileName,
      mimeType: photo.mimeType,
      fileSize: photo.fileSize,
      createdAt: photo.createdAt.toISOString(),
    };
  }
}
