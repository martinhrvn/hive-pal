import { Module } from '@nestjs/common';
import { ApiarySharingController } from './apiary-sharing.controller';
import { ApiarySharingService } from './apiary-sharing.service';
import { LoggerModule } from '../logger/logger.module';

@Module({
  imports: [LoggerModule],
  controllers: [ApiarySharingController],
  providers: [ApiarySharingService],
  exports: [ApiarySharingService],
})
export class ApiarySharingModule {}
