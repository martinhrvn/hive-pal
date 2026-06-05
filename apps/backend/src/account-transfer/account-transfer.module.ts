import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from '../logger/logger.module';
import { PrismaService } from '../prisma/prisma.service';
import { AccountTransferController } from './account-transfer.controller';
import { AccountTransferService } from './account-transfer.service';
import { AccountTransferExportRunner } from './account-transfer.export.runner';
import { AccountTransferImportRunner } from './account-transfer.import.runner';
import { AccountTransferSweeperService } from './account-transfer.sweeper.service';

const DEFAULT_MAX_IMPORT_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

@Module({
  imports: [
    LoggerModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        limits: {
          fileSize:
            configService.get<number>('MAX_IMPORT_SIZE_BYTES') ??
            DEFAULT_MAX_IMPORT_SIZE,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AccountTransferController],
  providers: [
    PrismaService,
    AccountTransferService,
    AccountTransferExportRunner,
    AccountTransferImportRunner,
    AccountTransferSweeperService,
  ],
})
export class AccountTransferModule {}
