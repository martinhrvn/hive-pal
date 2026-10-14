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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HiveService } from './hive.service';
import { SplitService } from './split.service';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { ApiaryOptional } from '../guards/apiary-optional.decorator';
import { RequestWithApiaryScope } from '../interface/request-with.apiary';
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
  splitHiveSchema,
  SplitHive,
  SplitHiveResponse,
} from 'shared-schemas';

@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('hives')
@Controller('hives')
@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
export class HiveController {
  constructor(
    private readonly hiveService: HiveService,
    private readonly splitService: SplitService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('HiveController');
  }

  @Post(':id/split')
  @ApiaryOptional()
  @ApiConsumes('application/json')
  @ZodValidation(splitHiveSchema)
  split(
    @Param('id') id: string,
    @Body() dto: SplitHive,
    @Req() req: RequestWithApiaryScope,
  ): Promise<SplitHiveResponse> {
    this.logger.log(`Splitting hive ${id} by user: ${req.user.id}`);
    return this.splitService.split(id, dto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id/splits/:splitId')
  @ApiaryOptional()
  async undoSplit(
    @Param('id') id: string,
    @Param('splitId') splitId: string,
    @Query('force') force: string | undefined,
    @Req() req: RequestWithApiaryScope,
  ): Promise<{ success: true }> {
    this.logger.log(`Undoing split ${splitId} on hive ${id}`);
    await this.splitService.undo(
      id,
      splitId,
      { apiaryId: req.apiaryId, userId: req.user.id },
      force === 'true',
    );
    return { success: true };
  }

  @Post()
  @ApiaryOptional()
  @ApiConsumes('application/json')
  @ZodValidation(createHiveSchema)
  create(
    @Body() createHiveDto: CreateHive,
    @Req() req: RequestWithApiaryScope,
  ): Promise<CreateHiveResponse> {
    this.logger.log(
      `Creating hive in apiary: ${createHiveDto.apiaryId} by user: ${req.user.id}`,
    );
    // The target apiary comes from the body and is checked for write access.
    return this.hiveService.create(createHiveDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get()
  @ApiaryOptional()
  @ZodValidation(hiveFilterSchema)
  findAll(
    @Query() query: HiveFilter,
    @Req() req: RequestWithApiaryScope,
  ): Promise<HiveResponse[]> {
    this.logger.log(
      `Getting all hives for apiary: ${req.apiaryId ?? 'ALL'} and user: ${req.user.id}`,
    );
    return this.hiveService.findAll({
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
      ...query,
    });
  }

  @Get(':id')
  @ApiaryOptional()
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<HiveDetailResponse> {
    this.logger.log(
      `Getting hive details for ID: ${id} in apiary: ${req.apiaryId ?? 'ALL'}`,
    );
    return this.hiveService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }

  @Patch(':id')
  @ApiaryOptional()
  @ZodValidation(updateHiveSchema)
  update(
    @Param('id') id: string,
    @Body() updateHiveDto: UpdateHive,
    @Req() req: RequestWithApiaryScope,
  ): Promise<UpdateHiveResponse> {
    return this.hiveService.update(id, updateHiveDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id/permanent')
  @ApiaryOptional()
  @HttpCode(HttpStatus.NO_CONTENT)
  removePermanently(
    @Param('id') id: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<void> {
    return this.hiveService.removePermanently(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @ApiaryOptional()
  remove(@Param('id') id: string, @Req() req: RequestWithApiaryScope) {
    return this.hiveService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Put(':id/boxes')
  @ApiaryOptional()
  @ApiConsumes('application/json')
  @ZodValidation(updateHiveBoxesSchema)
  updateBoxes(
    @Param('id') id: string,
    @Body() updateHiveBoxesDto: UpdateHiveBoxes,
    @Req() req: RequestWithApiaryScope,
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
