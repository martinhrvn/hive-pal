import { Global, Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { LoggerModule } from '../logger/logger.module';

@Global()
@Module({
  imports: [LoggerModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
