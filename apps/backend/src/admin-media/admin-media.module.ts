import { Module } from '@nestjs/common';
import { AdminMediaController } from './admin-media.controller';
import { AdminMediaService } from './admin-media.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdminMediaController],
  providers: [AdminMediaService, PrismaService],
})
export class AdminMediaModule {}
