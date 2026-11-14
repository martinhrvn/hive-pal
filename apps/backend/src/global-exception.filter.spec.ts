import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { vi } from 'vitest';
import type { CustomLoggerService } from './logger/logger.service';
import { GlobalExceptionFilter } from './global-exception.filter';

function setup() {
  const logger = {
    setContext: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => ({ url: '/api/storage/files/x', method: 'GET' }),
    }),
  } as unknown as ArgumentsHost;
  const filter = new GlobalExceptionFilter(
    logger as unknown as CustomLoggerService,
  );
  return { filter, logger, response, host };
}

describe('GlobalExceptionFilter', () => {
  it('logs client errors as warnings without a stack trace', () => {
    const { filter, logger, response, host } = setup();

    filter.catch(new NotFoundException(), host);

    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        path: '/api/storage/files/x',
      }),
    );
    expect(response.status).toHaveBeenCalledWith(404);
  });

  it('logs server errors with their stack trace', () => {
    const { filter, logger, response, host } = setup();
    const err = new Error('boom');

    filter.catch(err, host);

    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500, message: 'boom' }),
      err.stack,
    );
    expect(response.status).toHaveBeenCalledWith(500);
  });
});
