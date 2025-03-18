import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomLoggerService } from '../../logger/logger.service';

@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {
    super();
    this.logger.setContext('PrismaHealthIndicator');
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Execute a simple query to check the database connection
      await this.prismaService.$queryRaw`SELECT 1`;
      this.logger.debug('Database health check passed');

      return this.getStatus(key, true);
    } catch (error: unknown) {
      const errorMessage =
        typeof (error as { message?: string })?.message === 'string'
          ? String((error as { message: string }).message)
          : 'Unknown error';

      const errorStack =
        typeof (error as { stack?: string })?.stack === 'string'
          ? String((error as { stack: string }).stack)
          : undefined;

      this.logger.error(
        `Database health check failed: ${errorMessage}`,
        errorStack,
      );

      throw new HealthCheckError(
        'Prisma health check failed',
        this.getStatus(key, false, { message: errorMessage }),
      );
    }
  }
}
