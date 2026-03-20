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
import { PhotosService } from './photos.service';
import { ZodValidation } from '../common';
import {
  createPhotoSchema,
  CreatePhoto,
  PhotoResponse,
  photoFilterSchema,
  PhotoFilter,
} from 'shared-schemas';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('photos')
export class PhotosController {
  constructor(
    private readonly photosService: PhotosService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('PhotosController');
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
    @Req() req: RequestWithApiary,
  ): Promise<PhotoResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const dto: CreatePhoto = createPhotoSchema.parse({
      apiaryId: body.apiaryId,
      hiveId: body.hiveId || undefined,
      caption: body.caption || undefined,
      date: body.date || undefined,
    });

    this.logger.log({
      message: 'Creating photo',
      apiaryId: dto.apiaryId,
      hiveId: dto.hiveId,
      fileName: file.originalname,
    });

    return this.photosService.create(dto, file, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ZodValidation(photoFilterSchema)
  async findAll(
    @Query() query: PhotoFilter,
    @Req() req: RequestWithApiary,
  ): Promise<PhotoResponse[]> {
    this.logger.log({
      message: 'Listing photos',
      hiveId: query.hiveId,
    });

    return this.photosService.findAll({
      ...query,
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<PhotoResponse> {
    return this.photosService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id/download-url')
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ) {
    return this.photosService.getDownloadUrl(id, {
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
      message: 'Deleting photo',
      photoId: id,
    });

    await this.photosService.delete(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
