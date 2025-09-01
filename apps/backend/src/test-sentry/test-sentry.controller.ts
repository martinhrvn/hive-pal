import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Controller('test-sentry')
export class TestSentryController {
  @Get('message')
  testMessage() {
    Sentry.captureMessage('Test message from backend', 'info');
    return { message: 'Test message sent to Sentry' };
  }

  @Get('exception')
  testException() {
    try {
      JSON.parse('invalid json');
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
