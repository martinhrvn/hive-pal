import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Role,
} from '../auth/guards/jwt-auth.guard';
import { PlatformMetricsService } from './platform-metrics.service';
import {
  PlatformMetricsQueryParams,
  platformMetricsQueryParamsSchema,
} from 'shared-schemas';
import { PlatformMetricsSnapshot } from '@prisma/client';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@ApiTags('admin/platform-metrics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/platform-metrics')
export class PlatformMetricsController {
  constructor(
    private readonly platformMetricsService: PlatformMetricsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get platform metrics snapshots (admin only)' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'List of platform metrics snapshots',
  })
  async getSnapshots(
    @Query(new ZodValidationPipe(platformMetricsQueryParamsSchema))
    query: PlatformMetricsQueryParams,
  ): Promise<PlatformMetricsSnapshot[]> {
    const startDate = query?.startDate ? new Date(query.startDate) : undefined;
    const endDate = query?.endDate ? new Date(query.endDate) : undefined;

    return this.platformMetricsService.getSnapshots(startDate, endDate);
  }

  @Get('latest')
  @ApiOperation({ summary: 'Get latest platform metrics snapshot (admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Latest platform metrics snapshot',
  })
  async getLatestSnapshot(): Promise<PlatformMetricsSnapshot | null> {
    return this.platformMetricsService.getLatestSnapshot();
  }
}
