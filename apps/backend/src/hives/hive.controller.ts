import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { HiveService } from './hive.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { AuthGuard } from '../auth/auth.guard';

@Controller('hives')
@UseGuards(AuthGuard)
export class HiveController {
  constructor(private readonly hiveService: HiveService) {}

  @Post()
  create(@Body() createHiveDto: CreateHiveDto) {
    return this.hiveService.create(createHiveDto);
  }

  @Get()
  findAll() {
    return this.hiveService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.hiveService.findOne(id);
  }

  @Get(':id/state')
  getState(@Param('id') id: string) {
    return this.hiveService.calculateCurrentState(id);
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
