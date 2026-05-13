import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
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
    _filter: ApiaryUserFilter,
  ): Promise<PhotoResponse> {
    this.fileUpload.validateFile(file, CONFIG);
    if (dto.hiveId) {
      await this.fileUpload.validateHiveBelongsToApiary(
        dto.hiveId,
        dto.apiaryId,
      );
    }

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

    this.logger.log({
      message: 'Photo created',
      photoId: id,
      apiaryId: dto.apiaryId,
    });
    return this.mapToResponse(photo);
  }

  async findAll(filter: FileFilterInternal): Promise<PhotoResponse[]> {
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

  async createForInspection(
    inspectionId: string,
    file: Express.Multer.File,
    filter: ApiaryUserFilter,
    caption?: string,
  ): Promise<PhotoResponse> {
    this.fileUpload.validateFile(file, CONFIG);

    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        hive: { apiary: { id: filter.apiaryId } },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${inspectionId} not found`,
      );
    }

    // Enforce max photos per inspection
    const existingCount = await this.prisma.photo.count({
      where: { inspectionId },
    });
    if (existingCount >= 5) {
      throw new BadRequestException('Maximum 5 photos per inspection');
    }

    const { id, storageKey } = await this.fileUpload.uploadFile(
      file,
      'inspection-photos',
    );

    const photo = await this.prisma.photo.create({
      data: {
        id,
        apiaryId: filter.apiaryId,
        hiveId: inspection.hiveId,
        inspectionId,
        caption: caption ?? null,
        storageKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
      },
    });

    this.logger.log({
      message: 'Inspection photo created',
      photoId: id,
      inspectionId,
    });
    return this.mapToResponse(photo);
  }

  async findByInspection(
    inspectionId: string,
    filter: ApiaryUserFilter,
  ): Promise<PhotoResponse[]> {
    const inspection = await this.prisma.inspection.findFirst({
      where: {
        id: inspectionId,
        hive: { apiary: { id: filter.apiaryId } },
      },
    });

    if (!inspection) {
      throw new NotFoundException(
        `Inspection with ID ${inspectionId} not found`,
      );
    }

    const photos = await this.prisma.photo.findMany({
      where: { inspectionId },
      orderBy: { createdAt: 'desc' },
    });

    return photos.map((p) => this.mapToResponse(p));
  }

  async getInspectionPhotoDownloadUrl(
    inspectionId: string,
    photoId: string,
    filter: ApiaryUserFilter,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    const photo = await this.prisma.photo.findFirst({
      where: {
        id: photoId,
        inspectionId,
        inspection: {
          hive: { apiary: { id: filter.apiaryId } },
        },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    return this.fileUpload.getDownloadUrl(photo.storageKey);
  }

  async deleteInspectionPhoto(
    inspectionId: string,
    photoId: string,
    filter: ApiaryUserFilter,
  ): Promise<void> {
    const photo = await this.prisma.photo.findFirst({
      where: {
        id: photoId,
        inspectionId,
        inspection: {
          hive: { apiary: { id: filter.apiaryId } },
        },
      },
    });

    if (!photo) {
      throw new NotFoundException(`Photo with ID ${photoId} not found`);
    }

    await this.fileUpload.deleteFromStorage(photo.storageKey, photoId);
    await this.prisma.photo.delete({ where: { id: photoId } });

    this.logger.log({
      message: 'Inspection photo deleted',
      photoId,
      inspectionId,
    });
  }

  async deleteAllForInspection(inspectionId: string): Promise<void> {
    const photos = await this.prisma.photo.findMany({
      where: { inspectionId },
      select: { id: true, storageKey: true },
    });

    for (const photo of photos) {
      await this.fileUpload.deleteFromStorage(photo.storageKey, photo.id);
    }

    await this.prisma.photo.deleteMany({ where: { inspectionId } });

    this.logger.log({
      message: 'All inspection photos deleted',
      inspectionId,
      count: photos.length,
    });
  }

  private mapToResponse(photo: {
    id: string;
    hiveId: string | null;
    apiaryId: string;
    inspectionId: string | null;
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
      inspectionId: photo.inspectionId,
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
