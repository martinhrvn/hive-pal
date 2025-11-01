import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BatchInspectionsService } from './batch-inspections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  CreateBatchInspection,
  UpdateBatchInspection,
  ReorderBatchHives,
  createBatchInspectionSchema,
  updateBatchInspectionSchema,
  reorderBatchHivesSchema,
  CreateInspection,
  createInspectionSchema,
} from 'shared-schemas';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('batch-inspections')
@ApiBearerAuth()
@Controller('batch-inspections')
@UseGuards(JwtAuthGuard, ApiaryContextGuard)
export class BatchInspectionsController {
  constructor(
    private readonly batchInspectionsService: BatchInspectionsService,
  ) { }

  @Post()
  @ApiOperation({ summary: 'Create a new batch inspection' })
  async create(
    @Body(new ZodValidationPipe(createBatchInspectionSchema))
    createDto: CreateBatchInspection,
    @Req() req: any,
  ) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.create(apiaryId, userId, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all batch inspections for an apiary' })
  async findAll(@Req() req: any) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.findAll(apiaryId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific batch inspection' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.findOne(id, apiaryId, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update batch inspection (name only, DRAFT only)' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBatchInspectionSchema))
    updateDto: UpdateBatchInspection,
    @Req() req: any,
  ) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.update(id, apiaryId, userId, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete batch inspection (DRAFT only)' })
  async delete(@Param('id') id: string, @Req() req: any) {
    const { apiaryId, userId } = req;
    await this.batchInspectionsService.delete(id, apiaryId, userId);
    return { message: 'Batch inspection deleted successfully' };
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Reorder hives in batch (DRAFT only)' })
  async reorderHives(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reorderBatchHivesSchema))
    reorderDto: ReorderBatchHives,
    @Req() req: any,
  ) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.reorderHives(
      id,
      apiaryId,
      userId,
      reorderDto,
    );
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start batch inspection' })
  async start(@Param('id') id: string, @Req() req: any) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.start(id, apiaryId, userId);
  }

  @Get(':id/current')
  @ApiOperation({ summary: 'Get current hive to inspect' })
  async getCurrentHive(@Param('id') id: string, @Req() req: any) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.getCurrentHive(id, apiaryId, userId);
  }

  @Post(':id/skip')
  @ApiOperation({ summary: 'Skip current hive (move to end of queue)' })
  async skipHive(@Param('id') id: string, @Req() req: any) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.skipHive(id, apiaryId, userId);
  }

  @Delete(':id/hives/:hiveId')
  @ApiOperation({ summary: 'Cancel a hive from the batch' })
  async cancelHive(
    @Param('id') id: string,
    @Param('hiveId') hiveId: string,
    @Req() req: any,
  ) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.cancelHive(
      id,
      hiveId,
      apiaryId,
      userId,
    );
  }

  @Post(':id/inspect')
  @ApiOperation({ summary: 'Create inspection for current hive and move to next' })
  async createInspectionAndNext(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(createInspectionSchema))
    inspectionData: CreateInspection,
    @Req() req: any,
  ) {
    const { apiaryId, userId } = req;
    return this.batchInspectionsService.createInspectionAndNext(
      id,
      apiaryId,
      userId,
      inspectionData,
    );
  }
}
