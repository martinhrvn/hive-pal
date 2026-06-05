import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerModule } from '../logger/logger.module';
import { HiveModule } from '../hives/hive.module';
import { InspectionsModule } from '../inspections/inspections.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantRepository } from './assistant.repository';
import { AssistantAiService } from './assistant-ai.service';
import { ContextBuilderService } from './context-builder.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    LoggerModule,
    HiveModule,
    InspectionsModule,
  ],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantRepository,
    AssistantAiService,
    ContextBuilderService,
    PrismaService,
  ],
})
export class AssistantModule {}
