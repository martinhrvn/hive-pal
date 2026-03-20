import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PhotosController } from './photos.controller';
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
          fileSize:
            configService.get<number>('PHOTO_MAX_FILE_SIZE') || 10485760, // 10MB default
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [PhotosController],
  providers: [PhotosService, PrismaService],
  exports: [PhotosService],
})
export class PhotosModule {}
