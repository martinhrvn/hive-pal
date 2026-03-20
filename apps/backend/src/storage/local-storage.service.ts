import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { CustomLoggerService } from '../logger/logger.service';
import { StorageService } from './storage.interface';

export class LocalStorageService
  extends StorageService
  implements OnModuleInit {
  private basePath: string;
  private jwtSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: CustomLoggerService,
  ) {
    super();
  }

  async onModuleInit() {
    this.basePath = path.resolve(
      this.configService.get<string>('STORAGE_LOCAL_PATH') || '/data/uploads',
    );
    this.jwtSecret = this.configService.get<string>('JWT_SECRET') || '';

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

  generateUploadUrl(
    _key: string,
    _contentType: string,
    _expiresIn?: number,
  ): Promise<string> {
    throw new Error(
      'Upload URLs are not supported with local storage. Use uploadObject instead.',
    );
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async generateDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    const token = this.signToken(key, expires);
    const encodedKey = encodeURIComponent(key);
    return `/api/storage/files/${encodedKey}?token=${token}&expires=${expires}`;
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

  signToken(key: string, expires: number): string {
    const payload = `${key}:${expires}`;
    return crypto
      .createHmac('sha256', this.jwtSecret)
      .update(payload)
      .digest('hex');
  }

  verifyToken(key: string, token: string, expires: number): boolean {
    if (Math.floor(Date.now() / 1000) > expires) {
      return false;
    }
    const expected = this.signToken(key, expires);
    return crypto.timingSafeEqual(
      Buffer.from(token, 'hex'),
      Buffer.from(expected, 'hex'),
    );
  }
}
