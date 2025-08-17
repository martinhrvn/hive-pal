import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ActionsService } from './actions.service';
import {
  ActionFilter,
  ActionResponse,
  CreateStandaloneAction,
  actionFilterSchema,
  createStandaloneActionSchema,
} from 'shared-schemas';
import { ZodValidation } from '../common';

import { RequestWithApiary } from '../interface/request-with.apiary';

@Controller('actions')
@UseGuards(JwtAuthGuard, ApiaryContextGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  @ZodValidation(actionFilterSchema)
  findAll(
    @Query() query: ActionFilter,
    @Req() req: RequestWithApiary,
  ): Promise<ActionResponse[]> {
    return this.actionsService.findAll({
      apiaryId: req.apiaryId,
      userId: req.user.id,
      ...query,
    });
  }

  @Post()
  @ZodValidation(createStandaloneActionSchema)
  create(
    @Body() createActionDto: CreateStandaloneAction,
    @Req() req: RequestWithApiary,
  ): Promise<ActionResponse> {
    return this.actionsService.createStandaloneAction(
      createActionDto,
      req.apiaryId,
      req.user.id,
    );
  }
}
