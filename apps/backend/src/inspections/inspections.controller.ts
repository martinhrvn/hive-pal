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

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  create(
    @Body() createInspectionDto: CreateInspectionDto,
    @Req() req: RequestWithApiary,
  ) {
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
    return this.inspectionsService.update(id, updateInspectionDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithApiary) {
    return this.inspectionsService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
