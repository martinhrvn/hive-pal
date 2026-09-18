import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { ApiaryOptional } from '../guards/apiary-optional.decorator';
import { RequestWithApiaryScope } from '../interface/request-with.apiary';
import { AiProcessUploadResponse, AiService } from './ai.service';

@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
@ApiaryOptional()
@Controller('inspections/:inspectionId/audio/:audioId/ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('analyze')
  async analyze(
    @Param('inspectionId') inspectionId: string,
    @Param('audioId') audioId: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<AiProcessUploadResponse> {
    return this.aiService.analyzeInspectionAudio(inspectionId, audioId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
