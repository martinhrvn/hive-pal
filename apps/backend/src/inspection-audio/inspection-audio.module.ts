import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InspectionAudioController } from './inspection-audio.controller';
import { InspectionAudioService } from './inspection-audio.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [
    LoggerModule,
    forwardRef(() => InspectionsModule),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize:
            configService.get<number>('AUDIO_MAX_FILE_SIZE') || 52428800, // 50MB default
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [InspectionAudioController],
  providers: [InspectionAudioService, PrismaService],
  exports: [InspectionAudioService],
})
export class InspectionAudioModule {}
