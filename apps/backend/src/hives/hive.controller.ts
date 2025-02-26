import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';
import { HiveService } from './hive.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { HiveResponseDto } from './dto/hive-response.dto';
import { Type } from 'class-transformer';
import { ApiConsumes, ApiOkResponse } from '@nestjs/swagger';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('hives')
export class HiveController {
  constructor(private readonly hiveService: HiveService) {}

  @Post()
  @ApiConsumes('application/json')
  @ApiOkResponse({ type: HiveResponseDto })
  create(@Body() createHiveDto: CreateHiveDto): Promise<HiveResponseDto> {
    return this.hiveService.create(createHiveDto);
  }

  @Get()
  @ApiOkResponse({ type: HiveResponseDto, isArray: true })
  @SerializeOptions({ type: HiveResponseDto })
  findAll(): Promise<HiveResponseDto[]> {
    return this.hiveService.findAll();
  }

  @Get(':id')
  @Type(() => HiveResponseDto)
  findOne(@Param('id') id: string) {
    return this.hiveService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHiveDto: UpdateHiveDto) {
    return this.hiveService.update(id, updateHiveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hiveService.remove(id);
  }
}
