import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  SerializeOptions,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { ApiOkResponse } from '@nestjs/swagger';
import { CustomLoggerService } from '../logger/logger.service';

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
  create(
    @Body() createInspectionDto: CreateInspectionDto,
    @Req() req: RequestWithApiary,
  ) {
    this.logger.log(
      `Creating inspection for hive ${createInspectionDto.hiveId} in apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.create(createInspectionDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @SerializeOptions({ type: InspectionResponseDto })
  @ApiOkResponse({ type: InspectionResponseDto, isArray: true })
  findAll(
    @Query() query: InspectionFilterDto,
    @Req() req: RequestWithApiary,
  ): Promise<InspectionResponseDto[]> {
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
  @SerializeOptions({ type: InspectionResponseDto })
  @ApiOkResponse({ type: InspectionResponseDto })
  findOne(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(
      `Finding inspection with ID ${id} in apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
    @Req() req: RequestWithApiary,
  ) {
    this.logger.log(
      `Updating inspection with ID ${id} in apiary ${req.apiaryId}`,
    );
    this.logger.debug(`Update data: ${JSON.stringify(updateInspectionDto)}`);
    return this.inspectionsService.update(id, updateInspectionDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(
      `Removing inspection with ID ${id} from apiary ${req.apiaryId}`,
    );
    return this.inspectionsService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
