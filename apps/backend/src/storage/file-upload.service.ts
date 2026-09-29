import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from './storage.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { ApiaryScopeFilter } from '../interface/request-with.apiary';
import {
  apiaryReadScope,
  apiaryWriteAccessWhere,
  apiaryWriteScope,
} from '../common/apiary-scope';
import { Prisma } from '@/prisma/client';
import { v4 as uuidv4 } from 'uuid';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
};

export interface FileUploadConfig {
  allowedMimeTypes: string[];
  maxFileSize: number;
  storagePrefix: string;
  entityName: string;
}

export interface FileFilterInternal {
  hiveId?: string;
  // Selected apiary (a filter); absent = every apiary the user can access.
  apiaryId?: string;
  userId: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class FileUploadService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private logger: CustomLoggerService,
  ) {}

  /** Validates that storage is enabled, mime type is allowed, and file size is within limits. */
  validateFile(file: Express.Multer.File, config: FileUploadConfig): void {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        `${config.entityName} upload is not available. Storage is not configured.`,
      );
    }

    if (!config.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid ${config.entityName.toLowerCase()} format. Allowed formats: ${config.allowedMimeTypes.join(', ')}`,
      );
    }

    if (file.size > config.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed (${config.maxFileSize / 1024 / 1024}MB)`,
      );
    }
  }

  /** Verifies the user can write to the given apiary (owner, or active
   *  EDITOR/OWNER member). Used for the target apiary an upload names in its
   *  body, which the guard does not see. */
  async assertApiaryWritable(apiaryId: string, userId: string): Promise<void> {
    const apiary = await this.prisma.apiary.findFirst({
      where: { id: apiaryId, ...apiaryWriteAccessWhere(userId) },
      select: { id: true },
    });

    if (!apiary) {
      throw new NotFoundException(
        `Apiary with ID ${apiaryId} not found or you cannot edit it`,
      );
    }
  }

  /** Verifies that a hive belongs to the given apiary.
   *  Apiary existence and user authorization are handled by ApiaryContextGuard. */
  async validateHiveBelongsToApiary(
    hiveId: string,
    apiaryId: string,
  ): Promise<void> {
    const hive = await this.prisma.hive.findFirst({
      where: { id: hiveId, apiaryId },
    });

    if (!hive) {
      throw new NotFoundException(`Hive with ID ${hiveId} not found in apiary`);
    }
  }

  /** Uploads a file to storage and returns the generated id, storageKey, and extension. */
  async uploadFile(
    file: Express.Multer.File,
    storagePrefix: string,
  ): Promise<{ id: string; storageKey: string }> {
    const id = uuidv4();
    const extension = MIME_TO_EXT[file.mimetype] || 'bin';
    const storageKey = `${storagePrefix}/${id}/${id}.${extension}`;

    await this.storageService.uploadObject(
      storageKey,
      file.buffer,
      file.mimetype,
    );

    return { id, storageKey };
  }

  /** Generates a signed download URL for a storage key. */
  async getDownloadUrl(
    storageKey: string,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    if (!this.storageService.isEnabled()) {
      throw new BadRequestException(
        'Download is not available. Storage is not configured.',
      );
    }

    const expiresIn = 3600;
    const downloadUrl = await this.storageService.generateDownloadUrl(
      storageKey,
      expiresIn,
    );

    return { downloadUrl, expiresIn };
  }

  /** Deletes a file from storage, logging a warning on failure. */
  async deleteFromStorage(storageKey: string, entityId: string): Promise<void> {
    if (this.storageService.isEnabled()) {
      try {
        await this.storageService.deleteObject(storageKey);
      } catch (error) {
        this.logger.warn({
          message: 'Failed to delete file from storage',
          entityId,
          storageKey,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  /** Builds a Prisma where clause for list queries with apiary ownership, optional hive and date filters. */
  buildWhereClause(filter: FileFilterInternal): Record<string, unknown> {
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

    return where;
  }

  /** Builds the ownership where clause for single-entity lookups. */
  /** Where-clause for one file: read scope honours the selected apiary as a
   *  filter, write scope requires OWNER/EDITOR on the file's apiary. */
  ownershipWhere(
    id: string,
    filter: ApiaryScopeFilter,
    mode: 'read' | 'write' = 'read',
  ): { id: string; apiary: Prisma.ApiaryWhereInput } {
    return {
      id,
      apiary:
        mode === 'write' ? apiaryWriteScope(filter) : apiaryReadScope(filter),
    };
  }
}
