import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from '@nestjs/terminus';
import { PrismaService } from '../../prisma/prisma.service';
import { CustomLoggerService } from '../../logger/logger.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('PrismaHealthIndicator');
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      // Execute a simple query to check the database connection
      await this.prismaService.$queryRaw`SELECT 1`;
      this.logger.debug('Database health check passed');

      return indicator.up();
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

      return indicator.down({ message: errorMessage });
    }
  }
}
