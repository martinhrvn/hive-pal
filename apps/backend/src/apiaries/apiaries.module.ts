import { Module } from '@nestjs/common';
import { ApiariesService } from './apiaries.service';
import { ApiariesController } from './apiaries.controller';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [AuthModule, LoggerModule],
  controllers: [ApiariesController],
  providers: [ApiariesService, PrismaService],
})
export class ApiariesModule {}
