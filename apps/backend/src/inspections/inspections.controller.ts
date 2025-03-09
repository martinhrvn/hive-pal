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
} from '@nestjs/common';
import { InspectionsService } from './inspections.service';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { InspectionFilterDto } from './dto/inspection-filter.dto';
import { InspectionResponseDto } from './dto/inspection-response.dto';
import { ApiOkResponse } from '@nestjs/swagger';

@Controller('inspections')
export class InspectionsController {
  constructor(private readonly inspectionsService: InspectionsService) {}

  @Post()
  create(@Body() createInspectionDto: CreateInspectionDto) {
    return this.inspectionsService.create(createInspectionDto);
  }

  @Get()
  @SerializeOptions({ type: InspectionResponseDto })
  @ApiOkResponse({ type: InspectionResponseDto, isArray: true })
  findAll(@Query() query: InspectionFilterDto): Promise<InspectionResponseDto> {
    return this.inspectionsService.findAll(query);
  }

  @Get(':id')
  @SerializeOptions({ type: InspectionResponseDto })
  @ApiOkResponse({ type: InspectionResponseDto })
  findOne(@Param('id') id: string) {
    return this.inspectionsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateInspectionDto: UpdateInspectionDto,
  ) {
    return this.inspectionsService.update(id, updateInspectionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.inspectionsService.remove(id);
  }
}
