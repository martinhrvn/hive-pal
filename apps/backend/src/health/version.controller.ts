import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

export interface VersionResponse {
  /** Git commit the server was deployed from (Coolify's SOURCE_COMMIT). */
  commit: string | null;
  version: string | null;
}

/**
 * Reports which build is running, so CI can wait for a preview deployment to
 * serve a given commit before running smoke tests against it.
 */
@ApiTags('health')
@Controller('version')
export class VersionController {
  private readonly body: VersionResponse;

  constructor(config: ConfigService) {
    this.body = {
      commit: config.get<string>('SOURCE_COMMIT') || null,
      version: config.get<string>('APP_VERSION') || null,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Report the deployed commit and version' })
  @ApiResponse({ status: 200, description: 'The running build' })
  get(): VersionResponse {
    return this.body;
  }
}
