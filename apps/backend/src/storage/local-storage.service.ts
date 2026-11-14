import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import * as path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { CustomLoggerService } from '../logger/logger.service';
import { MediaUrlService } from './media-url.service';
import {
  ByteRange,
  StorageService,
  StoredObjectInfo,
} from './storage.interface';

export class LocalStorageService
  extends StorageService
  implements OnModuleInit
{
  private basePath: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
    private readonly mediaUrls: MediaUrlService,
  ) {
    super();
  }

  async onModuleInit() {
    this.basePath = path.resolve(
      this.configService.get<string>('STORAGE_LOCAL_PATH') || '/data/uploads',
    );

    await fs.mkdir(this.basePath, { recursive: true });

    this.logger.log({
      message: 'Local file storage configured',
      basePath: this.basePath,
    });
  }

  isEnabled(): boolean {
    return true;
  }

  async uploadObject(
    key: string,
    buffer: Buffer,
    _contentType: string,
  ): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
  }

  async uploadStream(
    key: string,
    stream: Readable,
    _contentType: string,
  ): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await pipeline(stream, createWriteStream(filePath));
  }

  getObject(key: string, range?: ByteRange): Promise<Readable> {
    const filePath = this.getFilePath(key);
    return Promise.resolve(createReadStream(filePath, range));
  }

  async statObject(key: string): Promise<StoredObjectInfo | null> {
    try {
      const stats = await fs.stat(this.getFilePath(key));
      return stats.isFile() ? { size: stats.size } : null;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw err;
    }
  }

  generateUploadUrl(
    _key: string,
    _contentType: string,
    _expiresIn?: number,
  ): Promise<string> {
    throw new Error(
      'Upload URLs are not supported with local storage. Use uploadObject instead.',
    );
  }

  generateDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    return Promise.resolve(
      this.mediaUrls.createExpiringUrl(key, expiresIn).downloadUrl,
    );
  }

  async deleteObject(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    try {
      await fs.unlink(filePath);
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw err;
      }
    }
  }

  async deleteObjects(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.deleteObject(key)));
  }

  getFilePath(key: string): string {
    if (path.isAbsolute(key) || key.split('/').includes('..')) {
      throw new Error('Path traversal detected');
    }
    const resolved = path.join(this.basePath, key);
    if (!resolved.startsWith(this.basePath + path.sep)) {
      throw new Error('Path traversal detected');
    }
    return resolved;
  }
}
