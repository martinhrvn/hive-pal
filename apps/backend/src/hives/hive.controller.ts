import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
} from '@nestjs/common';
import { HiveService } from './hive.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { HiveResponseDto } from './dto/hive-response.dto';
import { Type } from 'class-transformer';
import { ApiConsumes, ApiOkResponse } from '@nestjs/swagger';
import { updateHiveSchema } from 'validations';
import { ZodValidationPipe } from 'nestjs-zod';

@Controller('hives')
export class HiveController {
  constructor(private readonly hiveService: HiveService) {}

  @Post()
  @ApiConsumes('application/json')
  @UsePipes(ZodValidationPipe)
  create(@Body() createHiveDto: CreateHiveDto) {
    return this.hiveService.create(createHiveDto);
  }

  @Get()
  @ApiOkResponse({ type: HiveResponseDto, isArray: true })
  findAll() {
    return this.hiveService.findAll();
  }

  @Get(':id')
  @Type(() => HiveResponseDto)
  findOne(@Param('id') id: string) {
    return this.hiveService.findOne(id);
  }

  @Patch(':id')
  @UsePipes(new ZodValidationPipe(updateHiveSchema))
  update(@Param('id') id: string, @Body() updateHiveDto: UpdateHiveDto) {
    return this.hiveService.update(id, updateHiveDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.hiveService.remove(id);
  }
}
