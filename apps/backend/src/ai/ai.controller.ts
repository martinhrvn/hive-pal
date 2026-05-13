import { Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { AiProcessUploadResponse, AiService } from './ai.service';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('inspections/:inspectionId/audio/:audioId/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  async analyze(
    @Param('inspectionId') inspectionId: string,
    @Param('audioId') audioId: string,
  ): Promise<AiProcessUploadResponse> {
    return this.aiService.analyzeInspectionAudio(inspectionId, audioId);
  }
}
