import { Controller, Get } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';

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
