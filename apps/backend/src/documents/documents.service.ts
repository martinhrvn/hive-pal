import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryUserFilter } from '../interface/request-with.apiary';
import {
  FileUploadService,
  FileUploadConfig,
  FileFilterInternal,
} from '../storage/file-upload.service';
import { CreateDocument, DocumentResponse } from 'shared-schemas';

const CONFIG: FileUploadConfig = {
  allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
  maxFileSize: 20 * 1024 * 1024, // 20MB
  storagePrefix: 'documents',
  entityName: 'Document',
};

@Injectable()
export class DocumentsService {
  constructor(
    private prisma: PrismaService,
    private fileUpload: FileUploadService,
    private logger: CustomLoggerService,
  ) {}

  async create(
    dto: CreateDocument,
    file: Express.Multer.File,
    filter: ApiaryUserFilter,
  ): Promise<DocumentResponse> {
    this.fileUpload.validateFile(file, CONFIG);
    await this.fileUpload.validateOwnership(dto.apiaryId, filter.userId, dto.hiveId);

    const { id, storageKey } = await this.fileUpload.uploadFile(
      file,
      CONFIG.storagePrefix,
    );

    const document = await this.prisma.document.create({
      data: {
        id,
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

    this.logger.log({ message: 'Document created', documentId: id, apiaryId: dto.apiaryId });
    return this.mapToResponse(document);
  }

  async findAll(filter: FileFilterInternal): Promise<DocumentResponse[]> {
    await this.fileUpload.validateOwnership(filter.apiaryId, filter.userId);
    const where = this.fileUpload.buildWhereClause(filter);

    const documents = await this.prisma.document.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return documents.map((d) => this.mapToResponse(d));
  }

  async findOne(id: string, filter: ApiaryUserFilter): Promise<DocumentResponse> {
    const document = await this.prisma.document.findFirst({
      where: this.fileUpload.ownershipWhere(id, filter),
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
    const document = await this.prisma.document.findFirst({
      where: this.fileUpload.ownershipWhere(id, filter),
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return this.fileUpload.getDownloadUrl(document.storageKey);
  }

  async delete(id: string, filter: ApiaryUserFilter): Promise<void> {
    const document = await this.prisma.document.findFirst({
      where: this.fileUpload.ownershipWhere(id, filter),
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    await this.fileUpload.deleteFromStorage(document.storageKey, id);
    await this.prisma.document.delete({ where: { id } });

    this.logger.log({ message: 'Document deleted', documentId: id });
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
