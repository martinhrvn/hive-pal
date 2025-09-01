import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CustomLoggerService } from './logger/logger.service';
import { SentryExceptionCaptured } from '@sentry/nestjs';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: CustomLoggerService) {
    this.logger.setContext('Exception');
  }

  @SentryExceptionCaptured()
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get request ID if available
    const requestId = request['requestId'] as string | undefined;
    // Extract meaningful data
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: exception.message || 'Internal server error',
      requestId,
    };

    // Log the error with full trace
    this.logger.error(
      {
        exceptionName: exception.name,
        ...errorResponse,
        exception: JSON.stringify(exception),
      },
      exception.stack,
    );

    // Send response to client (hide sensitive details in production)
    response.status(status).json(errorResponse);
  }
}
