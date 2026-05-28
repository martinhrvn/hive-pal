import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AdminMediaListQuery,
  AdminMediaListResponse,
  AdminMediaStatsResponse,
  AdminMediaType,
  adminMediaListQuerySchema,
  adminMediaTypeSchema,
} from 'shared-schemas';
import {
  JwtAuthGuard,
  Role,
  Roles,
  RolesGuard,
} from '../auth/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AdminMediaService } from './admin-media.service';

@ApiTags('admin/media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly service: AdminMediaService) {}

  @Get()
  @ApiOperation({ summary: 'List uploaded media across the platform (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated media list' })
  list(
    @Query(new ZodValidationPipe(adminMediaListQuerySchema))
    query: AdminMediaListQuery,
  ): Promise<AdminMediaListResponse> {
    return this.service.list(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Aggregate media stats (admin)' })
  stats(): Promise<AdminMediaStatsResponse> {
    return this.service.stats();
  }

  @Get(':type/:id/download-url')
  @ApiOperation({
    summary: 'Signed download/preview URL for a media item (admin)',
  })
  downloadUrl(
    @Param('type', new ZodValidationPipe(adminMediaTypeSchema))
    type: AdminMediaType,
    @Param('id') id: string,
  ): Promise<{ downloadUrl: string; expiresIn: number }> {
    return this.service.getDownloadUrl(type, id);
  }
}
