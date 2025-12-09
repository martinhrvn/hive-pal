import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import {
  InspectionAudioService,
  UploadAudioDto,
  AudioResponse,
  DownloadUrlResponse,
} from './inspection-audio.service';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('inspections/:inspectionId/audio')
export class InspectionAudioController {
  constructor(
    private readonly audioService: InspectionAudioService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('InspectionAudioController');
  }

  /**
   * Upload an audio recording
   */
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('inspectionId') inspectionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadAudioDto,
    @Req() req: RequestWithApiary,
  ): Promise<AudioResponse> {
    if (!file) {
      throw new BadRequestException('No audio file provided');
    }

    this.logger.log({
      message: 'Uploading audio recording',
      inspectionId,
      fileName: dto.fileName,
      mimeType: file.mimetype,
      fileSize: file.size,
    });

    return this.audioService.upload(inspectionId, file, dto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  /**
   * List all audio recordings for an inspection
   */
  @Get()
  async findAll(
    @Param('inspectionId') inspectionId: string,
    @Req() req: RequestWithApiary,
  ): Promise<AudioResponse[]> {
    this.logger.log({
      message: 'Listing audio recordings',
      inspectionId,
    });

    return this.audioService.findAll(inspectionId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  /**
   * Get a pre-signed download URL for an audio recording
   */
  @Get(':audioId/download-url')
  async getDownloadUrl(
    @Param('inspectionId') inspectionId: string,
    @Param('audioId') audioId: string,
    @Req() req: RequestWithApiary,
  ): Promise<DownloadUrlResponse> {
    this.logger.log({
      message: 'Getting download URL for audio',
      inspectionId,
      audioId,
    });

    return this.audioService.getDownloadUrl(inspectionId, audioId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  /**
   * Delete an audio recording
   */
  @Delete(':audioId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('inspectionId') inspectionId: string,
    @Param('audioId') audioId: string,
    @Req() req: RequestWithApiary,
  ): Promise<void> {
    this.logger.log({
      message: 'Deleting audio recording',
      inspectionId,
      audioId,
    });

    await this.audioService.delete(inspectionId, audioId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
