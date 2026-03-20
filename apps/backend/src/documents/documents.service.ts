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
import { CreateDocument, DocumentResponse } from 'shared-schemas';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface DocumentFilterInternal {
  hiveId?: string;
  apiaryId: string;
  userId: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private logger: CustomLoggerService,
  ) {}

  async create(
    dto: CreateDocument,
    file: Express.Multer.File,
    filter: ApiaryUserFilter,
  ): Promise<DocumentResponse> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Document upload is not available. Storage is not configured.',
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid document format. Allowed formats: ${ALLOWED_MIME_TYPES.join(', ')}`,
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

    const documentId = uuidv4();
    const extension = this.getExtensionFromMimeType(file.mimetype);
    const storageKey = `documents/${documentId}/${documentId}.${extension}`;

    await this.storageService.uploadObject(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    const document = await this.prisma.document.create({
      data: {
        id: documentId,
        apiaryId: dto.apiaryId,
        hiveId: dto.hiveId ?? null,
        title: dto.title,
        notes: dto.notes ?? null,
        storageKey,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        date: dto.date ? new Date(dto.date) : new Date(),
      },
    });

    this.logger.log({
      message: 'Document created',
      documentId: document.id,
      apiaryId: dto.apiaryId,
    });

    return this.mapToResponse(document);
  }

  async findAll(filter: DocumentFilterInternal): Promise<DocumentResponse[]> {
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

    const documents = await this.prisma.document.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return documents.map((d) => this.mapToResponse(d));
  }

  async findOne(
    id: string,
    filter: ApiaryUserFilter,
  ): Promise<DocumentResponse> {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        apiary: { id: filter.apiaryId, userId: filter.userId },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return this.mapToResponse(document);
  }

  async getDownloadUrl(
    id: string,
    filter: ApiaryUserFilter,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Document download is not available. Storage is not configured.',
      );
    }

    const document = await this.prisma.document.findFirst({
      where: {
        id,
        apiary: { id: filter.apiaryId, userId: filter.userId },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    const expiresIn = 3600;
    const downloadUrl = await this.storageService.generateDownloadUrl(
      document.storageKey,
      expiresIn,
    );

    return { downloadUrl, expiresIn };
  }

  async delete(id: string, filter: ApiaryUserFilter): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        apiary: { id: filter.apiaryId, userId: filter.userId },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    if (this.storageService.isEnabled()) {
      try {
        await this.storageService.deleteObject(document.storageKey);
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete document from storage',
          documentId: id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.prisma.document.delete({ where: { id } });

    this.logger.log({
      message: 'Document deleted',
      documentId: id,
    });
  }

  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'application/pdf': 'pdf',
      'image/jpeg': 'jpg',
      'image/png': 'png',
    };
    return mimeToExt[mimeType] || 'bin';
  }

  private mapToResponse(document: {
    id: string;
    hiveId: string | null;
    apiaryId: string;
    title: string;
    notes: string | null;
    fileName: string;
    mimeType: string;
    fileSize: number;
    date: Date;
    createdAt: Date;
    updatedAt: Date;
  }): DocumentResponse {
    return {
      id: document.id,
      hiveId: document.hiveId,
      apiaryId: document.apiaryId,
      title: document.title,
      notes: document.notes,
      fileName: document.fileName,
      mimeType: document.mimeType,
      fileSize: document.fileSize,
      date: document.date.toISOString(),
      createdAt: document.createdAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
    };
  }
}
