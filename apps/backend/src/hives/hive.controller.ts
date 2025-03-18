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
  Query,
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
import { CustomLoggerService } from '../logger/logger.service';
import { HiveFilterDto } from './dto/hive-filter.dto';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('hives')
@Controller('hives')
@UseGuards(JwtAuthGuard, ApiaryContextGuard)
export class HiveController {
  constructor(
    private readonly hiveService: HiveService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('HiveController');
  }

  @Post()
  @ApiConsumes('application/json')
  @SerializeOptions({ type: HiveResponseDto })
  @ApiOkResponse({ type: HiveResponseDto })
  create(
    @Body() createHiveDto: CreateHiveDto,
    @Req() req: RequestWithApiary,
  ): Promise<HiveResponseDto> {
    this.logger.log(
      `Creating hive in apiary: ${createHiveDto.apiaryId} by user: ${req.user.id}`,
    );
    // Set the apiaryId from the request
    return this.hiveService.create(createHiveDto);
  }

  @Get()
  @ApiOkResponse({ type: HiveResponseDto, isArray: true })
  @SerializeOptions({ type: HiveResponseDto })
  findAll(
    @Query() query: HiveFilterDto,
    @Req() req: RequestWithApiary,
  ): Promise<HiveResponseDto[]> {
    this.logger.log(
      `Getting all hives for apiary: ${req.apiaryId} and user: ${req.user.id}`,
    );
    return this.hiveService.findAll({
      apiaryId: req.apiaryId,
      userId: req.user.id,
      ...query,
    });
  }

  @Get(':id')
  @Type(() => HiveDetailResponseDto)
  @ApiOkResponse({ type: HiveDetailResponseDto })
  @SerializeOptions({ type: HiveDetailResponseDto })
  findOne(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(
      `Getting hive details for ID: ${id} in apiary: ${req.apiaryId}`,
    );
    return this.hiveService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateHiveDto: UpdateHiveDto,
    @Req() req: RequestWithApiary,
  ) {
    return this.hiveService.update(id, updateHiveDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithApiary) {
    return this.hiveService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
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
    @Req() req: RequestWithApiary,
  ) {
    this.logger.log(
      `Updating boxes for hive ID: ${id} with ${updateHiveBoxesDto.boxes.length} boxes`,
    );
    return this.hiveService.updateBoxes(id, updateHiveBoxesDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
