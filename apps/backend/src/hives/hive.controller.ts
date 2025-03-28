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
  Put,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HiveService } from './hive.service';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  createHiveSchema,
  updateHiveSchema,
  updateHiveBoxesSchema,
  hiveFilterSchema,
  CreateHive,
  UpdateHive,
  UpdateHiveBoxes,
  HiveResponse,
  HiveDetailResponse,
  HiveFilter,
  UpdateHiveResponse,
  CreateHiveResponse,
} from 'shared-schemas';

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
  @ZodValidation(createHiveSchema)
  create(
    @Body() createHiveDto: CreateHive,
    @Req() req: RequestWithApiary,
  ): Promise<CreateHiveResponse> {
    this.logger.log(
      `Creating hive in apiary: ${createHiveDto.apiaryId} by user: ${req.user.id}`,
    );
    // Set the apiaryId from the request
    return this.hiveService.create(createHiveDto);
  }

  @Get()
  @ZodValidation(hiveFilterSchema)
  findAll(
    @Query() query: HiveFilter,
    @Req() req: RequestWithApiary,
  ): Promise<HiveResponse[]> {
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
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<HiveDetailResponse> {
    this.logger.log(
      `Getting hive details for ID: ${id} in apiary: ${req.apiaryId}`,
    );
    return this.hiveService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Patch(':id')
  @ZodValidation(updateHiveSchema)
  update(
    @Param('id') id: string,
    @Body() updateHiveDto: UpdateHive,
    @Req() req: RequestWithApiary,
  ): Promise<UpdateHiveResponse> {
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
  @ZodValidation(updateHiveBoxesSchema)
  updateBoxes(
    @Param('id') id: string,
    @Body() updateHiveBoxesDto: UpdateHiveBoxes,
    @Req() req: RequestWithApiary,
  ): Promise<UpdateHiveResponse> {
    this.logger.log(
      `Updating boxes for hive ID: ${id} with ${updateHiveBoxesDto.boxes.length} boxes`,
    );
    return this.hiveService.updateBoxes(id, updateHiveBoxesDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
