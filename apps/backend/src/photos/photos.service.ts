import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import {
  FileUploadService,
  FileUploadConfig,
  FileFilterInternal,
} from '../storage/file-upload.service';
import { CreatePhoto, PhotoResponse } from 'shared-schemas';

const CONFIG: FileUploadConfig = {
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  storagePrefix: 'photos',
  entityName: 'Photo',
};

@Injectable()
export class PhotosService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
    private logger: CustomLoggerService,
  ) {}

  async create(
    dto: CreatePhoto,
    file: Express.Multer.File,
    filter: ApiaryUserFilter,
  ): Promise<PhotoResponse> {
    this.fileUpload.validateFile(file, CONFIG);
    await this.fileUpload.validateOwnership(dto.apiaryId, filter.userId, dto.hiveId);

    const { id, storageKey } = await this.fileUpload.uploadFile(
      file,
      CONFIG.storagePrefix,
    );

    const photo = await this.prisma.photo.create({
      data: {
        id,
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

    this.logger.log({ message: 'Photo created', photoId: id, apiaryId: dto.apiaryId });
    return this.mapToResponse(photo);
  }

  async findAll(filter: FileFilterInternal): Promise<PhotoResponse[]> {
    await this.fileUpload.validateOwnership(filter.apiaryId, filter.userId);
    const where = this.fileUpload.buildWhereClause(filter);

    const photos = await this.prisma.photo.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return photos.map((p) => this.mapToResponse(p));
  }

  async findOne(id: string, filter: ApiaryUserFilter): Promise<PhotoResponse> {
    const photo = await this.prisma.photo.findFirst({
      where: this.fileUpload.ownershipWhere(id, filter),
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
    const photo = await this.prisma.photo.findFirst({
      where: this.fileUpload.ownershipWhere(id, filter),
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    return this.fileUpload.getDownloadUrl(photo.storageKey);
  }

  async delete(id: string, filter: ApiaryUserFilter): Promise<void> {
    const photo = await this.prisma.photo.findFirst({
      where: this.fileUpload.ownershipWhere(id, filter),
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${id} not found`);
    }

    await this.fileUpload.deleteFromStorage(photo.storageKey, id);
    await this.prisma.photo.delete({ where: { id } });

    this.logger.log({ message: 'Photo deleted', photoId: id });
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
