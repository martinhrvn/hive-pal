import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { createWorkerTokenSchema, CreateWorkerTokenDto } from 'shared-schemas';
import { WorkerTokensService } from './worker-tokens.service';
import {
  JwtAuthGuard,
  RolesGuard,
  Roles,
  Role,
} from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { ZodValidation } from '../common';

@ApiTags('worker-tokens')
@Controller('admin/worker-tokens')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@ApiBearerAuth()
export class WorkerTokensController {
  constructor(private readonly workerTokensService: WorkerTokensService) {}

  @Get()
  @ApiOperation({ summary: 'List all worker tokens (admin)' })
  async list() {
    return this.workerTokensService.list();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new worker token; plaintext token is returned only once',
  })
  @ZodValidation(createWorkerTokenSchema)
  async create(@Body() dto: CreateWorkerTokenDto, @Req() req: RequestWithUser) {
    return this.workerTokensService.create(dto.name, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a worker token (admin)' })
  async revoke(@Param('id') id: string) {
    return this.workerTokensService.revoke(id);
  }
}
