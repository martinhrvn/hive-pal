import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  ClassSerializerInterceptor,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueensService } from './queens.service';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ApiaryPermissionGuard } from '../guards/apiary-permission.guard';
import { AllowAllApiaries } from '../guards/allow-all-apiaries.decorator';
import {
  RequestWithApiary,
  RequestWithApiaryScope,
} from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  createQueenSchema,
  updateQueenSchema,
  recordQueenTransferSchema,
  CreateQueen,
  UpdateQueen,
  QueenResponse,
  RecordQueenTransfer,
  QueenDetail,
} from 'shared-schemas';

@ApiTags('queens')
@UseGuards(JwtAuthGuard, ApiaryContextGuard, ApiaryPermissionGuard)
@Controller('queens')
@UseInterceptors(ClassSerializerInterceptor)
export class QueensController {
  constructor(
    private readonly queensService: QueensService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('QueensController');
  }

  @Post()
  @ApiCreatedResponse({ type: Object })
  @ZodValidation(createQueenSchema)
  create(
    @Body() createQueenDto: CreateQueen,
    @Req() req: RequestWithApiary,
  ): Promise<QueenResponse> {
    this.logger.log(
      `Creating queen for hive ${createQueenDto.hiveId} in apiary ${req.apiaryId}`,
    );
    return this.queensService.create(createQueenDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get('hive/:hiveId/history')
  @AllowAllApiaries()
  @ApiOkResponse({ type: Object, isArray: true })
  getHiveHistory(
    @Param('hiveId') hiveId: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<QueenResponse[]> {
    this.logger.log(`Getting queen history for hive ${hiveId}`);
    return this.queensService.getHiveQueenHistory(hiveId, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }

  @Get()
  @AllowAllApiaries()
  @ApiOkResponse({ type: Object, isArray: true })
  findAll(
    @Req() req: RequestWithApiaryScope,
    @Query('status') status?: string,
    @Query('hiveId') hiveId?: string,
  ): Promise<QueenResponse[]> {
    this.logger.log(`Finding all queens in apiary ${req.apiaryId ?? 'ALL'}`);
    return this.queensService.findAll(
      {
        apiaryId: req.apiaryId,
        userId: req.user.id,
        allApiaries: req.allApiaries,
      },
      { status, hiveId },
    );
  }

  @Get(':id/history')
  @AllowAllApiaries()
  @ApiOkResponse({ type: Object })
  getHistory(
    @Param('id') id: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<QueenDetail> {
    this.logger.log(`Getting history for queen ${id}`);
    return this.queensService.getQueenHistory(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }

  @Post(':id/transfer')
  @ApiOkResponse({ type: Object })
  @ZodValidation(recordQueenTransferSchema)
  recordTransfer(
    @Param('id') id: string,
    @Body() dto: RecordQueenTransfer,
    @Req() req: RequestWithApiary,
  ): Promise<QueenDetail> {
    this.logger.log(`Recording transfer for queen ${id}`);
    return this.queensService.recordTransfer(id, dto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  @AllowAllApiaries()
  @ApiOkResponse({ type: Object })
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiaryScope,
  ): Promise<QueenResponse> {
    this.logger.log(
      `Finding queen with ID ${id} in apiary ${req.apiaryId ?? 'ALL'}`,
    );
    return this.queensService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
      allApiaries: req.allApiaries,
    });
  }

  @Patch(':id')
  @ApiOkResponse({ type: Object })
  @ZodValidation(updateQueenSchema)
  update(
    @Param('id') id: string,
    @Body() updateQueenDto: UpdateQueen,
    @Req() req: RequestWithApiary,
  ): Promise<QueenResponse> {
    this.logger.log(`Updating queen with ID ${id} in apiary ${req.apiaryId}`);
    this.logger.debug(`Update data: ${JSON.stringify(updateQueenDto)}`);
    return this.queensService.update(id, updateQueenDto, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Delete(':id')
  @ApiOkResponse({ type: Object })
  remove(@Param('id') id: string, @Req() req: RequestWithApiary) {
    this.logger.log(`Removing queen with ID ${id} from apiary ${req.apiaryId}`);
    return this.queensService.remove(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }
}
