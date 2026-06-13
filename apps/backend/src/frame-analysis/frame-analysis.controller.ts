import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { FrameAnalysisResponse } from 'shared-schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { FrameAiService } from './frame-ai.service';

@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
@Controller('photos/:id')
export class FrameAnalysisController {
  constructor(private readonly frameAiService: FrameAiService) {}

  @Post('analyze-frame')
  async analyze(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<FrameAnalysisResponse> {
    return this.frameAiService.analyze(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get('frame-analysis')
  async getAnalysis(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<FrameAnalysisResponse> {
    const analysis = await this.frameAiService.getAnalysis(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
    if (!analysis) {
      throw new NotFoundException(`No frame analysis for photo ${id}`);
    }
    return analysis;
  }
}
