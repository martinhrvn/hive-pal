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
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { RequestWithApiaryScope } from '../interface/request-with.apiary';
import { ApiaryOptional } from '../guards/apiary-optional.decorator';
import { CustomLoggerService } from '../logger/logger.service';
import { PhotosService } from './photos.service';
import { PhotoResponse } from 'shared-schemas';

@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
@ApiaryOptional()
@Controller('inspections/:inspectionId/photos')
export class InspectionPhotosController {
  constructor(
    private readonly photosService: PhotosService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('InspectionPhotosController');
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('inspectionId') inspectionId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
    @Req() req: RequestWithApiaryScope,
  ): Promise<PhotoResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    this.logger.log({
      message: 'Uploading inspection photo',
      inspectionId,
      fileName: file.originalname,
    });

    return this.photosService.createForInspection(
      inspectionId,
      file,
      { apiaryId: req.apiaryId, userId: req.user.id },
      body.caption,
    );
  }

  @Get()
  async findAll(
    @Param('inspectionId') inspectionId: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<PhotoResponse[]> {
    return this.photosService.findByInspection(inspectionId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':photoId/download-url')
  async getDownloadUrl(
    @Param('inspectionId') inspectionId: string,
    @Param('photoId') photoId: string,
    @Req() req: RequestWithApiaryScope,
  ) {
    return this.photosService.getInspectionPhotoDownloadUrl(
      inspectionId,
      photoId,
      { apiaryId: req.apiaryId, userId: req.user.id },
    );
  }

  @Delete(':photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('inspectionId') inspectionId: string,
    @Param('photoId') photoId: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<void> {
    this.logger.log({
      message: 'Deleting inspection photo',
      inspectionId,
      photoId,
    });

    await this.photosService.deleteInspectionPhoto(inspectionId, photoId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
