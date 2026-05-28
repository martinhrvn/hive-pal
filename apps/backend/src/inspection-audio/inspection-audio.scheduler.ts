import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InspectionAudioService } from './inspection-audio.service';

@Injectable()
export class InspectionAudioScheduler {
  private readonly logger = new Logger(InspectionAudioScheduler.name);

  constructor(
    private readonly inspectionAudioService: InspectionAudioService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runPullFallback(): Promise<void> {
    try {
      await this.inspectionAudioService.runPullFallbackSweep();
    } catch (err) {
      this.logger.error(
        'Pull fallback sweep failed',
        err instanceof Error ? err.stack : err,
      );
    }
  }
}
