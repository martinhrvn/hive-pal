import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.interface';
import { S3StorageService } from './s3-storage.service';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';
import { LoggerModule } from '../logger/logger.module';
import { CustomLoggerService } from '../logger/logger.service';

@Global()
@Module({
  imports: [LoggerModule],
  controllers: [StorageController],
  providers: [
    {
      provide: StorageService,
      useFactory: (
        configService: ConfigService,
        logger: CustomLoggerService,
      ) => {
        const storageType = configService.get<string>('STORAGE_TYPE') || 's3';
        if (storageType === 'local') {
          return new LocalStorageService(configService, logger);
        }
        return new S3StorageService(configService, logger);
      },
      inject: [ConfigService, CustomLoggerService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
