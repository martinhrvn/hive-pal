import { Module } from '@nestjs/common';
import { TestSentryController } from './test-sentry.controller';

@Module({
  controllers: [TestSentryController],
})
export class TestSentryModule {}