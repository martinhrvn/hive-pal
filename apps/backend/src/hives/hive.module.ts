import { Module } from '@nestjs/common';
import { HiveController } from './hive.controller';
import { HiveService } from './hive.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthModule } from '../auth/auth.module';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerModule } from '../logger/logger.module';
import { ActionsModule } from '../actions/actions.module';
import { UsersModule } from '../users/users.module';
import { InspectionsModule } from '../inspections/inspections.module';

@Module({
  imports: [AuthModule, LoggerModule, ActionsModule, UsersModule, InspectionsModule],
  controllers: [HiveController],
  providers: [
    HiveService,
    PrismaService,
    MetricsService,
  ],
})
export class HiveModule {}
