import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseByteLimit } from '../utils/byte-limit';
import { PhotosController } from './photos.controller';
import { InspectionPhotosController } from './inspection-photos.controller';
import { PhotosService } from './photos.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [
    LoggerModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize: parseByteLimit(
            configService.get('PHOTO_MAX_FILE_SIZE'),
            10485760, // 10MB default
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PhotosController, InspectionPhotosController],
  providers: [PhotosService, PrismaService],
  exports: [PhotosService],
})
export class PhotosModule {}
