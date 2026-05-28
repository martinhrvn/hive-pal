import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkerJobsService } from './worker-jobs.service';
import { WorkerRequest, WorkerTokenAuthGuard } from './worker-token-auth.guard';
import { ZodValidation } from '../common';
import {
  completeAnalysisSchema,
  CompleteAnalysisDto,
  completeTranscriptionSchema,
  CompleteTranscriptionDto,
  failJobSchema,
  FailJobDto,
} from './dto/worker-jobs.dto';

@ApiTags('worker-jobs')
@Controller('worker')
export class WorkerJobsController {
  constructor(private readonly workerJobsService: WorkerJobsService) {}

  // Public summary — used by the frontend to show "worker online" indicator.
  @Get('status')
  @ApiOperation({ summary: 'Get worker fleet status summary' })
  async getStatus() {
    return this.workerJobsService.getStatusSummary();
  }

  @Post('heartbeat')
  @UseGuards(WorkerTokenAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Worker liveness ping; updates lastSeenAt' })
  heartbeat() {
    // Side effect handled by the guard.
    return;
  }

  @Post('jobs/transcription/claim')
  @UseGuards(WorkerTokenAuthGuard)
  @ApiOperation({ summary: 'Claim the next pending transcription job' })
  async claimTranscription(@Req() req: WorkerRequest) {
    const job = await this.workerJobsService.claimTranscription(
      req.workerToken.id,
    );
    if (!job) {
      return { job: null };
    }
    return { job };
  }

  @Post('jobs/transcription/:audioId/complete')
  @UseGuards(WorkerTokenAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Submit transcription result' })
  @ZodValidation(completeTranscriptionSchema)
  async completeTranscription(
    @Param('audioId') audioId: string,
    @Body() dto: CompleteTranscriptionDto,
    @Req() req: WorkerRequest,
  ) {
    await this.workerJobsService.completeTranscription(
      audioId,
      req.workerToken.id,
      dto.text,
      dto.duration,
    );
  }

  @Post('jobs/transcription/:audioId/fail')
  @UseGuards(WorkerTokenAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Report a transcription failure' })
  @ZodValidation(failJobSchema)
  async failTranscription(
    @Param('audioId') audioId: string,
    @Body() dto: FailJobDto,
    @Req() req: WorkerRequest,
  ) {
    await this.workerJobsService.failTranscription(
      audioId,
      req.workerToken.id,
      dto.error,
    );
  }

  @Post('jobs/analysis/claim')
  @UseGuards(WorkerTokenAuthGuard)
  @ApiOperation({ summary: 'Claim the next pending analysis job' })
  async claimAnalysis(@Req() req: WorkerRequest) {
    const job = await this.workerJobsService.claimAnalysis(req.workerToken.id);
    if (!job) {
      return { job: null };
    }
    return { job };
  }

  @Post('jobs/analysis/:audioId/complete')
  @UseGuards(WorkerTokenAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Submit analysis result (parsed JSON draft)' })
  @ZodValidation(completeAnalysisSchema)
  async completeAnalysis(
    @Param('audioId') audioId: string,
    @Body() dto: CompleteAnalysisDto,
    @Req() req: WorkerRequest,
  ) {
    await this.workerJobsService.completeAnalysis(
      audioId,
      req.workerToken.id,
      dto.inspectionDraft,
    );
  }

  @Post('jobs/analysis/:audioId/fail')
  @UseGuards(WorkerTokenAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Report an analysis failure' })
  @ZodValidation(failJobSchema)
  async failAnalysis(
    @Param('audioId') audioId: string,
    @Body() dto: FailJobDto,
    @Req() req: WorkerRequest,
  ) {
    await this.workerJobsService.failAnalysis(
      audioId,
      req.workerToken.id,
      dto.error,
    );
  }
}
