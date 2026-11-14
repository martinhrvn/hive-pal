import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.interface';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';
import { FileUploadService } from './file-upload.service';
import { MediaUrlService } from './media-url.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';
import { CustomLoggerService } from '../logger/logger.service';

@Global()
@Module({
  imports: [LoggerModule],
  controllers: [StorageController],
  providers: [
    MediaUrlService,
    {
      provide: StorageService,
      useFactory: (
        configService: ConfigService,
        logger: CustomLoggerService,
        mediaUrls: MediaUrlService,
      ) => {
        const storageType = configService.get<string>('STORAGE_TYPE') || 's3';
        if (storageType === 'local') {
          return new LocalStorageService(configService, logger, mediaUrls);
        }
        return new S3StorageService(configService, logger);
      },
      inject: [ConfigService, CustomLoggerService, MediaUrlService],
    },
    FileUploadService,
    PrismaService,
  ],
  exports: [StorageService, FileUploadService, MediaUrlService],
})
export class StorageModule {}
