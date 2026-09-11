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
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { AllowAllApiaries } from '../guards/allow-all-apiaries.decorator';
import {
  RequestWithApiary,
  RequestWithApiaryScope,
} from '../interface/request-with.apiary';
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

@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
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
  @AllowAllApiaries()
  @ZodValidation(inspectionFilterSchema)
  async findAll(
    @Query() query: InspectionFilter,
    @Req() req: RequestWithApiaryScope,
  ): Promise<InspectionResponse[]> {
    this.logger.log(
      `Finding inspections for apiary ${req.apiaryId ?? 'ALL'}${query.hiveId ? `, hive ${query.hiveId}` : ''}`,
    );
    return this.inspectionsService.findAll({
      ...query,
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }

  @Get(':id')
  @AllowAllApiaries()
  async findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<InspectionResponse | null> {
    this.logger.log(
      `Finding inspection with ID ${id} in apiary ${req.apiaryId ?? 'ALL'}`,
    );
    return this.inspectionsService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
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
  async remove(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
    @Query('revertFrames') revertFrames?: string,
  ) {
    this.logger.log(
      `Removing inspection with ID ${id} from apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.remove(
      id,
      {
        apiaryId: req.apiaryId,
        userId: req.user.id,
      },
      revertFrames === 'true',
    );
  }

  @Get('status/overdue')
  @AllowAllApiaries()
  async findOverdue(
    @Req() req: RequestWithApiaryScope,
  ): Promise<InspectionResponse[]> {
    this.logger.log(
      `Finding overdue inspections for apiary ${req.apiaryId ?? 'ALL'}`,
    );
    return this.inspectionsService.findOverdueInspections({
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }

  @Get('status/due-today')
  @AllowAllApiaries()
  async findDueToday(
    @Req() req: RequestWithApiaryScope,
  ): Promise<InspectionResponse[]> {
    this.logger.log(
      `Finding due today inspections for apiary ${req.apiaryId ?? 'ALL'}`,
    );
    return this.inspectionsService.findDueTodayInspections({
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }
}
