import { Module, forwardRef } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { parseByteLimit } from '../utils/byte-limit';
import { InspectionAudioController } from './inspection-audio.controller';
import { ApiaryAudioController } from './apiary-audio.controller';
import { InspectionAudioService } from './inspection-audio.service';
import { InspectionAudioScheduler } from './inspection-audio.scheduler';
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
          fileSize: parseByteLimit(
            configService.get('AUDIO_MAX_FILE_SIZE'),
            52428800, // 50MB default
          ),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [InspectionAudioController, ApiaryAudioController],
  providers: [InspectionAudioService, InspectionAudioScheduler, PrismaService],
  exports: [InspectionAudioService],
})
export class InspectionAudioModule {}
