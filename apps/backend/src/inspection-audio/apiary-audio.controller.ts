import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { RequestWithApiaryScope } from '../interface/request-with.apiary';
import { ApiaryOptional } from '../guards/apiary-optional.decorator';
import { CustomLoggerService } from '../logger/logger.service';
import {
  ApiaryAudioListItem,
  InspectionAudioService,
} from './inspection-audio.service';

@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
@ApiaryOptional()
@Controller('audio')
export class ApiaryAudioController {
  constructor(
    private readonly audioService: InspectionAudioService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ApiaryAudioController');
  }

  @Get()
  async findAll(
    @Req() req: RequestWithApiaryScope,
  ): Promise<ApiaryAudioListItem[]> {
    return this.audioService.findAllForApiary({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Post('analyze-pending')
  @HttpCode(HttpStatus.ACCEPTED)
  async startAnalysisForPending(
    @Req() req: RequestWithApiaryScope,
  ): Promise<{ started: number }> {
    return this.audioService.startAnalysisForPending({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
