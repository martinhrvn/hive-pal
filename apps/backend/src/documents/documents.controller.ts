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
import { DocumentsService } from './documents.service';
import { ZodValidation } from '../common';
import {
  createDocumentSchema,
  CreateDocument,
  DocumentResponse,
  documentFilterSchema,
  DocumentFilter,
} from 'shared-schemas';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('DocumentsController');
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: Record<string, string>,
    @Req() req: RequestWithApiary,
  ): Promise<DocumentResponse> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const dto: CreateDocument = createDocumentSchema.parse({
      apiaryId: body.apiaryId,
      hiveId: body.hiveId || undefined,
      title: body.title,
      notes: body.notes || undefined,
      date: body.date || undefined,
    });

    this.logger.log({
      message: 'Creating document',
      apiaryId: dto.apiaryId,
      hiveId: dto.hiveId,
      fileName: file.originalname,
    });

    return this.documentsService.create(dto, file, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ZodValidation(documentFilterSchema)
  async findAll(
    @Query() query: DocumentFilter,
    @Req() req: RequestWithApiary,
  ): Promise<DocumentResponse[]> {
    this.logger.log({
      message: 'Listing documents',
      hiveId: query.hiveId,
    });

    return this.documentsService.findAll({
      ...query,
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<DocumentResponse> {
    return this.documentsService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id/download-url')
  async getDownloadUrl(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ) {
    return this.documentsService.getDownloadUrl(id, {
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
      message: 'Deleting document',
      documentId: id,
    });

    await this.documentsService.delete(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
