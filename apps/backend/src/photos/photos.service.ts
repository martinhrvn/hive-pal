import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import { v4 as uuidv4 } from 'uuid';
import { CreatePhoto, PhotoResponse } from 'shared-schemas';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface PhotoFilterInternal {
  hiveId?: string;
  apiaryId: string;
  userId: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private logger: CustomLoggerService,
  ) {}

  async create(
    dto: CreatePhoto,
    file: Express.Multer.File,
    filter: ApiaryUserFilter,
  ): Promise<PhotoResponse> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Photo upload is not available. Storage is not configured.',
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid photo format. Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      );
    }

    const apiary = await this.prisma.apiary.findFirst({
      where: { id: dto.apiaryId, userId: filter.userId },
    });

    if (!apiary) {
      throw new NotFoundException(`Apiary with ID ${dto.apiaryId} not found`);
    }

    if (dto.hiveId) {
      const hive = await this.prisma.hive.findFirst({
        where: { id: dto.hiveId, apiaryId: dto.apiaryId },
      });

      if (!hive) {
        throw new NotFoundException(
          `Hive with ID ${dto.hiveId} not found in apiary`,
        );
      }
    }

    const photoId = uuidv4();
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const storageKey = `photos/${photoId}/${photoId}.${extension}`;

    await this.storageService.uploadObject(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    const photo = await this.prisma.photo.create({
      data: {
        id: photoId,
        apiaryId: dto.apiaryId,
        hiveId: dto.hiveId ?? null,
        caption: dto.caption ?? null,
        storageKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });

    this.logger.log({
      message: 'Photo created',
      photoId: photo.id,
      apiaryId: dto.apiaryId,
    });

    return this.mapToResponse(photo);
  }

  async findAll(filter: PhotoFilterInternal): Promise<PhotoResponse[]> {
    const apiary = await this.prisma.apiary.findFirst({
      where: { id: filter.apiaryId, userId: filter.userId },
    });

    if (!apiary) {
      throw new NotFoundException(
        `Apiary with ID ${filter.apiaryId} not found`,
      );
    }

    const where: Record<string, unknown> = {
      apiary: { id: filter.apiaryId, userId: filter.userId },
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

    const photos = await this.prisma.photo.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return photos.map((p) => this.mapToResponse(p));
  }

  async findOne(
    id: string,
    filter: ApiaryUserFilter,
  ): Promise<PhotoResponse> {
    const photo = await this.prisma.photo.findFirst({
      where: {
        id,
        apiary: { id: filter.apiaryId, userId: filter.userId },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    return this.mapToResponse(photo);
  }

  async getDownloadUrl(
    id: string,
    filter: ApiaryUserFilter,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Photo download is not available. Storage is not configured.',
      );
    }

    const photo = await this.prisma.photo.findFirst({
      where: {
        id,
        apiary: { id: filter.apiaryId, userId: filter.userId },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    const expiresIn = 3600;
    const downloadUrl = await this.storageService.generateDownloadUrl(
      photo.storageKey,
      expiresIn,
    );

    return { downloadUrl, expiresIn };
  }

  async delete(id: string, filter: ApiaryUserFilter): Promise<void> {
    const photo = await this.prisma.photo.findFirst({
      where: {
        id,
        apiary: { id: filter.apiaryId, userId: filter.userId },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    if (this.storageService.isEnabled()) {
      try {
        await this.storageService.deleteObject(photo.storageKey);
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete photo from storage',
          photoId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.prisma.photo.delete({ where: { id } });

    this.logger.log({
      message: 'Photo deleted',
      photoId: id,
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

  private mapToResponse(photo: {
    id: string;
    hiveId: string | null;
    apiaryId: string;
    caption: string | null;
    fileName: string;
    mimeType: string;
    fileSize: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): PhotoResponse {
    return {
      id: photo.id,
      hiveId: photo.hiveId,
      apiaryId: photo.apiaryId,
      caption: photo.caption,
      fileName: photo.fileName,
      mimeType: photo.mimeType,
      fileSize: photo.fileSize,
      date: photo.date.toISOString(),
      createdAt: photo.createdAt.toISOString(),
      updatedAt: photo.updatedAt.toISOString(),
    };
  }
}
