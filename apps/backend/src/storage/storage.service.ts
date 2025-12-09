import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CustomLoggerService } from '../logger/logger.service';

export interface StorageConfig {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private s3Client: S3Client | null = null;
  private bucket: string;
  private isConfigured = false;

  constructor(
    private configService: ConfigService,
    private logger: CustomLoggerService,
  ) {}

  onModuleInit() {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const region = this.configService.get<string>('S3_REGION') || 'us-east-1';
    const bucket = this.configService.get<string>('S3_BUCKET');
    const accessKeyId = this.configService.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'S3_SECRET_ACCESS_KEY',
    );

    if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
      this.logger.warn({
        message:
          'S3 storage not configured. Audio recording feature will be disabled.',
        missing: {
          endpoint: !endpoint,
          bucket: !bucket,
          accessKeyId: !accessKeyId,
          secretAccessKey: !secretAccessKey,
        },
      });
      return;
    }

    this.bucket = bucket;
    this.s3Client = new S3Client({
      endpoint,
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Required for MinIO and other S3-compatible services
    });
    this.isConfigured = true;

    this.logger.log({
      message: 'S3 storage configured successfully',
      endpoint,
      bucket,
    });
  }

  /**
   * Check if storage is properly configured
   */
  isEnabled(): boolean {
    return this.isConfigured;
  }

  /**
   * Generate a pre-signed URL for uploading a file
   */
  async generateUploadUrl(
    key: string,
    contentType: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    this.ensureConfigured();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });

    return getSignedUrl(this.s3Client!, command, { expiresIn });
  }

  /**
   * Generate a pre-signed URL for downloading a file
   */
  async generateDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    this.ensureConfigured();

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client!, command, { expiresIn });
  }

  /**
   * Delete a single object from storage
   */
  async deleteObject(key: string): Promise<void> {
    this.ensureConfigured();

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client!.send(command);
  }

  /**
   * Delete multiple objects from storage
   */
  async deleteObjects(keys: string[]): Promise<void> {
    if (keys.length === 0) return;

    this.ensureConfigured();

    const command = new DeleteObjectsCommand({
      Bucket: this.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
      },
    });

    await this.s3Client!.send(command);
  }

  /**
   * Upload a file directly to storage
   */
  async uploadObject(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<void> {
    this.ensureConfigured();

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    });

    await this.s3Client!.send(command);
  }

  private ensureConfigured(): void {
    if (!this.isConfigured || !this.s3Client) {
      throw new Error(
        'S3 storage is not configured. Please set S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID, and S3_SECRET_ACCESS_KEY environment variables.',
      );
    }
  }
}
