import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from '../storage/storage.interface';
import { FeaturesResponse } from 'shared-schemas';

@Controller('features')
export class FeaturesController {
  constructor(
    private readonly storageService: StorageService,
    private readonly config: ConfigService,
  ) {}

  @Get()
  getFeatures(): FeaturesResponse {
    return {
      storageEnabled: this.storageService.isEnabled(),
      aiEnabled: this.config.get<string>('AI_ENABLED') === 'true',
    };
  }
}
