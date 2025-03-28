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
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueensService } from './queens.service';
import { ApiCreatedResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  createQueenSchema,
  updateQueenSchema,
  CreateQueen,
  UpdateQueen,
  QueenResponse,
} from 'shared-schemas';

@ApiTags('queens')
@UseGuards(JwtAuthGuard, ApiaryContextGuard)
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

  @Get()
  @ApiOkResponse({ type: Object, isArray: true })
  findAll(@Req() req: RequestWithApiary): Promise<QueenResponse[]> {
    this.logger.log(`Finding all queens in apiary ${req.apiaryId}`);
    return this.queensService.findAll({
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get(':id')
  @ApiOkResponse({ type: Object })
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<QueenResponse> {
    this.logger.log(`Finding queen with ID ${id} in apiary ${req.apiaryId}`);
    return this.queensService.findOne(id, {
      apiaryId: req.apiaryId,
      userId: req.user.id,
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
