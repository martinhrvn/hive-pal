import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  UsePipes,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { InspectionsService } from './inspections.service';
import { CustomLoggerService } from '../logger/logger.service';
import {
  createInspectionSchema,
  updateInspectionSchema,
  inspectionFilterSchema,
  CreateInspection,
  UpdateInspection,
  InspectionFilter,
  InspectionResponse,
  UpdateInspectionResponse,
  CreateInspectionResponse,
} from 'shared-schemas';
import { ZodValidation, ZodValidationPipe } from '../common';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(
    private readonly inspectionsService: InspectionsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('InspectionsController');
  }

  @Post()
  @ZodValidation(createInspectionSchema)
  async create(
    @Body() createInspectionDto: CreateInspection,
    @Req() req: RequestWithApiary,
  ): Promise<CreateInspectionResponse> {
    this.logger.log(
      `Creating inspection for hive ${createInspectionDto.hiveId} in apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.create(createInspectionDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ZodValidation(inspectionFilterSchema)
  async findAll(
    @Query() query: InspectionFilter,
    @Req() req: RequestWithApiary,
  ): Promise<InspectionResponse[]> {
    this.logger.log(
      `Finding inspections for apiary ${req.apiaryId}${query.hiveId ? `, hive ${query.hiveId}` : ''}`,
    );
    return this.inspectionsService.findAll({
      ...query,
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<InspectionResponse | null> {
    this.logger.log(
      `Finding inspection with ID ${id} in apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateInspectionSchema))
  async update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspection,
    @Req() req: RequestWithApiary,
  ): Promise<UpdateInspectionResponse> {
    this.logger.log(
      `Updating inspection with ID ${id} in apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.update(id, updateInspectionDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(
      `Removing inspection with ID ${id} from apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get('status/overdue')
  async findOverdue(
    @Req() req: RequestWithApiary,
  ): Promise<InspectionResponse[]> {
    this.logger.log(`Finding overdue inspections for apiary ${req.apiaryId}`);
    return this.inspectionsService.findOverdueInspections({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get('status/due-today')
  async findDueToday(
    @Req() req: RequestWithApiary,
  ): Promise<InspectionResponse[]> {
    this.logger.log(`Finding due today inspections for apiary ${req.apiaryId}`);
    return this.inspectionsService.findDueTodayInspections({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
