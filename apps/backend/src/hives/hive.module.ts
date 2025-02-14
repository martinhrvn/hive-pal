import { Module } from '@nestjs/common';
import { HiveController } from './hive.controller';
import { HiveService } from './hive.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HiveController],
  providers: [HiveService, PrismaService],
})
export class HiveModule {}
