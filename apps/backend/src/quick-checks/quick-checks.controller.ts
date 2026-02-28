import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
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
import { QuickChecksService } from './quick-checks.service';
import { ZodValidation } from '../common';
import {
  createQuickCheckSchema,
  CreateQuickCheck,
  QuickCheckResponse,
  QuickCheckPhotoResponse,
  quickCheckFilterSchema,
  QuickCheckFilter,
} from 'shared-schemas';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('quick-checks')
export class QuickChecksController {
  constructor(
    private readonly quickChecksService: QuickChecksService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('QuickChecksController');
  }

  @Post()
  @ZodValidation(createQuickCheckSchema)
  async create(
    @Body() dto: CreateQuickCheck,
    @Req() req: RequestWithApiary,
  ): Promise<QuickCheckResponse> {
    this.logger.log({
      message: 'Creating quick check',
      apiaryId: dto.apiaryId,
      hiveId: dto.hiveId,
    });

    return this.quickChecksService.create(dto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ZodValidation(quickCheckFilterSchema)
  async findAll(
    @Query() query: QuickCheckFilter,
    @Req() req: RequestWithApiary,
  ): Promise<QuickCheckResponse[]> {
    this.logger.log({
      message: 'Listing quick checks',
      hiveId: query.hiveId,
    });

    return this.quickChecksService.findAll({
      ...query,
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<QuickCheckResponse> {
    this.logger.log({
      message: 'Getting quick check',
      quickCheckId: id,
    });

    return this.quickChecksService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<void> {
    this.logger.log({
      message: 'Deleting quick check',
      quickCheckId: id,
    });

    await this.quickChecksService.delete(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Post(':id/photos')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: RequestWithApiary,
  ): Promise<QuickCheckPhotoResponse> {
    if (!file) {
      throw new BadRequestException('No photo file provided');
    }

    this.logger.log({
      message: 'Uploading quick check photo',
      quickCheckId: id,
      fileName: file.originalname,
      fileSize: file.size,
    });

    return this.quickChecksService.uploadPhoto(id, file, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id/photos/:photoId/download-url')
  async getPhotoDownloadUrl(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Req() req: RequestWithApiary,
  ) {
    this.logger.log({
      message: 'Getting photo download URL',
      quickCheckId: id,
      photoId,
    });

    return this.quickChecksService.getPhotoDownloadUrl(id, photoId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id/photos/:photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhoto(
    @Param('id') id: string,
    @Param('photoId') photoId: string,
    @Req() req: RequestWithApiary,
  ): Promise<void> {
    this.logger.log({
      message: 'Deleting quick check photo',
      quickCheckId: id,
      photoId,
    });

    await this.quickChecksService.deletePhoto(id, photoId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
