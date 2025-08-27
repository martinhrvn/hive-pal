import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { AlertsService } from './alerts.service';
import { AlertsScheduler } from './alerts.scheduler';
import {
  updateAlertSchema,
  alertFilterSchema,
  AlertResponse,
  UpdateAlert,
  AlertFilter,
} from 'shared-schemas';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly alertsService: AlertsService,
    private readonly alertsScheduler: AlertsScheduler,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts for the current apiary' })
  @ApiResponse({
    status: 200,
    description: 'List of alerts',
  })
  async findAll(
    @Query(new ZodValidationPipe(alertFilterSchema)) query: AlertFilter,
    @Request() req: any,
  ): Promise<AlertResponse[]> {
    return this.alertsService.findAll({
      ...req.apiaryContext,
      ...(query || {}),
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific alert by ID' })
  @ApiResponse({
    status: 200,
    description: 'Alert details',
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found',
  })
  async findOne(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<AlertResponse> {
    return this.alertsService.findOne(id, req.apiaryContext);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update alert status' })
  @ApiResponse({
    status: 200,
    description: 'Alert updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found',
  })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAlertSchema)) updateAlertDto: UpdateAlert,
    @Request() req: any,
  ): Promise<AlertResponse> {
    return this.alertsService.update(id, updateAlertDto, req.apiaryContext);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  @ApiResponse({
    status: 200,
    description: 'Alert dismissed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found',
  })
  async dismiss(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<AlertResponse> {
    return this.alertsService.dismiss(id, req.apiaryContext);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Mark an alert as resolved' })
  @ApiResponse({
    status: 200,
    description: 'Alert resolved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Alert not found',
  })
  async resolve(
    @Param('id') id: string,
    @Request() req: any,
  ): Promise<AlertResponse> {
    return this.alertsService.resolve(id, req.apiaryContext);
  }

  @Post('check')
  @ApiOperation({ summary: 'Manually trigger alert check (admin/testing)' })
  @ApiResponse({
    status: 200,
    description: 'Alert check completed',
  })
  async triggerCheck(): Promise<{ message: string; checkers: string[] }> {
    await this.alertsScheduler.runAlertChecks();
    return {
      message: 'Alert check completed successfully',
      checkers: this.alertsScheduler.getRegisteredCheckers(),
    };
  }

  @Get('checkers/status')
  @ApiOperation({ summary: 'Get status of registered checkers' })
  @ApiResponse({
    status: 200,
    description: 'List of registered checkers',
  })
  async getCheckersStatus(): Promise<{ checkers: string[] }> {
    return {
      checkers: this.alertsScheduler.getRegisteredCheckers(),
    };
  }
}
