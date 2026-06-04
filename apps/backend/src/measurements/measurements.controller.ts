import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard, RequestWithApiKey } from '../auth/guards/api-key.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { MeasurementsService } from './measurements.service';
import { ZodValidation } from '../common';
import {
  CreateMeasurementBatch,
  CreateMeasurementBatchResponse,
  createMeasurementBatchSchema,
  LatestMeasurementsResponse,
  MeasurementFilter,
  measurementFilterSchema,
  MeasurementResponse,
} from 'shared-schemas';

@Controller()
export class MeasurementsController {
  constructor(
    private readonly measurementsService: MeasurementsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('MeasurementsController');
  }

  @Post('hives/:id/measurements')
  @UseGuards(ApiKeyGuard)
  @ZodValidation(createMeasurementBatchSchema)
  async ingest(
    @Param('id') hiveId: string,
    @Body() dto: CreateMeasurementBatch,
    @Req() req: RequestWithApiKey,
  ): Promise<CreateMeasurementBatchResponse> {
    this.logger.log({
      message: 'Ingesting measurements',
      hiveId,
      apiaryId: req.apiaryId,
      count: dto.measurements.length,
    });
    return this.measurementsService.createBatch(hiveId, req.apiaryId, dto);
  }

  @Get('hives/:id/measurements')
  @UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
  @ZodValidation(measurementFilterSchema)
  async list(
    @Param('id') hiveId: string,
    @Query() query: MeasurementFilter,
    @Req() req: RequestWithApiary,
  ): Promise<MeasurementResponse[]> {
    return this.measurementsService.findForHive(hiveId, req.apiaryId, query);
  }

  @Get('hives/:id/measurements/latest')
  @UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
  async latest(
    @Param('id') hiveId: string,
    @Req() req: RequestWithApiary,
  ): Promise<LatestMeasurementsResponse> {
    return this.measurementsService.findLatestForHive(hiveId, req.apiaryId);
  }
}
