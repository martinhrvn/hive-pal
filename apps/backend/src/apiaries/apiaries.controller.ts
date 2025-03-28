import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiariesService } from './apiaries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  createApiarySchema,
  updateApiarySchema,
  CreateApiary,
  UpdateApiary,
  ApiaryResponse,
} from 'shared-schemas';

@UseGuards(JwtAuthGuard)
@Controller('apiaries')
@UseInterceptors(ClassSerializerInterceptor)
export class ApiariesController {
  constructor(
    private readonly apiariesService: ApiariesService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ApiariesController');
  }

  @Post()
  @ZodValidation(createApiarySchema)
  create(
    @Body() createApiaryDto: CreateApiary,
    @Req() req: RequestWithUser,
  ): Promise<ApiaryResponse> {
    this.logger.log(
      `Creating apiary with name ${createApiaryDto.name} for user ${req.user.id}`,
    );
    return this.apiariesService.create(createApiaryDto, req.user.id);
  }

  @Get()
  findAll(@Req() req: RequestWithUser): Promise<ApiaryResponse[]> {
    this.logger.log(`Getting all apiaries for user ${req.user.id}`);
    return this.apiariesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ): Promise<ApiaryResponse> {
    this.logger.log(`Getting apiary with ID ${id} for user ${req.user.id}`);
    return this.apiariesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ZodValidation(updateApiarySchema)
  update(
    @Param('id') id: string,
    @Body() updateApiaryDto: UpdateApiary,
    @Req() req: RequestWithUser,
  ): Promise<ApiaryResponse> {
    this.logger.log(`Updating apiary with ID ${id} for user ${req.user.id}`);
    return this.apiariesService.update(id, updateApiaryDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    this.logger.log(`Deleting apiary with ID ${id} for user ${req.user.id}`);
    return this.apiariesService.remove(id, req.user.id);
  }
}
