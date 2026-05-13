import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { safeJsonParse } from '../utils/safe-json-parse';
import { z } from 'zod';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

@Controller('test-sentry')
export class TestSentryController {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}
  @Get('message')
  testMessage() {
    Sentry.captureMessage('Test message from backend', 'info');
    return { message: 'Test message sent to Sentry' };
  }

  @Get('exception')
  testException() {
    try {
      const result = safeJsonParse(
        'invalid json',
        z.unknown(),
        this.logger,
        'Sentry test',
      );
      if (result === null) {
        throw new Error('JSON parsing intentionally failed for Sentry test');
      }
    } catch (error) {
      Sentry.captureException(error);
      throw new HttpException(
        'Exception captured and sent to Sentry',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Get('error')
  testError() {
    throw new Error('Test error from backend for Sentry');
  }

  @Get('http-error')
  testHttpError() {
    throw new HttpException(
      'Test HTTP error for Sentry',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
