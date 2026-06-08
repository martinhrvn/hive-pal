import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { EquipmentService } from './equipment.service';
import { UsersStatsService } from './users-stats.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [UsersController],
  providers: [UsersService, EquipmentService, UsersStatsService, PrismaService],
  exports: [UsersService, EquipmentService],
})
export class UsersModule {}
