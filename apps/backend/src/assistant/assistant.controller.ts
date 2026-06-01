import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  AssistantThreadFilter,
  assistantThreadFilterSchema,
  AssistantThreadResponse,
  AssistantThreadWithMessagesResponse,
  CreateAssistantThread,
  createAssistantThreadSchema,
  SendAssistantMessage,
  sendAssistantMessageSchema,
} from 'shared-schemas';
import { AssistantService } from './assistant.service';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('assistant')
export class AssistantController {
  constructor(
    private readonly assistantService: AssistantService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('AssistantController');
  }

  @Post('threads')
  @ZodValidation(createAssistantThreadSchema)
  async createThread(
    @Body() dto: CreateAssistantThread,
    @Req() req: RequestWithApiary,
  ): Promise<AssistantThreadResponse> {
    return this.assistantService.createThread(dto, req.apiaryId);
  }

  @Get('threads')
  @ZodValidation(assistantThreadFilterSchema)
  async listThreads(
    @Query() query: AssistantThreadFilter,
    @Req() req: RequestWithApiary,
  ): Promise<AssistantThreadResponse[]> {
    return this.assistantService.listThreads(req.apiaryId, query.hiveId);
  }

  @Get('threads/:id')
  async getThread(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<AssistantThreadWithMessagesResponse> {
    return this.assistantService.getThread(id, req.apiaryId);
  }

  @Post('threads/:id/messages')
  @ZodValidation(sendAssistantMessageSchema)
  async sendMessage(
    @Param('id') id: string,
    @Body() dto: SendAssistantMessage,
    @Req() req: RequestWithApiary,
    @Res() res: Response,
  ): Promise<void> {
    await this.assistantService.streamMessage(
      id,
      req.apiaryId,
      req.user.id,
      dto.content,
      res,
    );
  }

  @Delete('threads/:id')
  @HttpCode(204)
  async deleteThread(
    @Param('id') id: string,
    @Req() req: RequestWithApiary,
  ): Promise<void> {
    return this.assistantService.deleteThread(id, req.apiaryId);
  }
}
