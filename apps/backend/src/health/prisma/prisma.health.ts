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
    } catch (error) {
      this.logger.error(
        `Database health check failed: ${error.message}`,
        error.stack,
      );

      throw new HealthCheckError(
        'Prisma health check failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
