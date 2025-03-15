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
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HiveService } from './hive.service';
import { CreateHiveDto } from './dto/create-hive.dto';
import { UpdateHiveDto } from './dto/update-hive.dto';
import { HiveResponseDto } from './dto/hive-response.dto';
import { HiveDetailResponseDto } from './dto/hive-detail-response.dto';
import { Type } from 'class-transformer';
import { ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { UpdateHiveBoxesDto } from './dto/update-hive-boxes.dto';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';

@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(JwtAuthGuard)
@ApiTags('hives')
@Controller('hives')
@UseGuards(ApiaryContextGuard)
export class HiveController {
  constructor(private readonly hiveService: HiveService) {}

  @Post()
  @ApiConsumes('application/json')
  @SerializeOptions({ type: HiveResponseDto })
  @ApiOkResponse({ type: HiveResponseDto })
  create(@Body() createHiveDto: CreateHiveDto): Promise<HiveResponseDto> {
    return this.hiveService.create(createHiveDto);
  }

  @Get()
  @ApiOkResponse({ type: HiveResponseDto, isArray: true })
  @SerializeOptions({ type: HiveResponseDto })
  findAll(@Req() req: RequestWithApiary): Promise<HiveResponseDto[]> {
    return this.hiveService.findAll({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  @Type(() => HiveDetailResponseDto)
  @ApiOkResponse({ type: HiveDetailResponseDto })
  @SerializeOptions({ type: HiveDetailResponseDto })
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

  @Put(':id/boxes')
  @ApiConsumes('application/json')
  @ApiOkResponse({
    description: 'Boxes updated successfully',
    type: HiveDetailResponseDto,
  })
  @SerializeOptions({ type: HiveDetailResponseDto })
  updateBoxes(
    @Param('id') id: string,
    @Body() updateHiveBoxesDto: UpdateHiveBoxesDto,
  ) {
    return this.hiveService.updateBoxes(id, updateHiveBoxesDto);
  }
}
