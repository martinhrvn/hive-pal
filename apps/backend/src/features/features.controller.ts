import { Controller, Get } from '@nestjs/common';
import { StorageService } from '../storage/storage.interface';

@Controller('features')
export class FeaturesController {
  constructor(private readonly storageService: StorageService) {}

  @Get()
  getFeatures() {
    return {
      storageEnabled: this.storageService.isEnabled(),
    };
  }
}
