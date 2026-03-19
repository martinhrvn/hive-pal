import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiaryJoinRequestsService, ApiaryOption, JoinRequestInfo } from './apiary-join-requests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';

@ApiTags('apiary-join-requests')
@Controller('apiary-join-requests')
export class ApiaryJoinRequestsController {
  constructor(private readonly service: ApiaryJoinRequestsService) {}

  @Get('lookup')
  @UseGuards(JwtAuthGuard)
  lookupApiaries(@Query('email') email: string): Promise<ApiaryOption[]> {
    return this.service.lookupApiariesByOwnerEmail(email);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  createJoinRequest(
    @Req() req: RequestWithApiary,
    @Body('apiaryId') apiaryId: string,
  ): Promise<void> {
    return this.service.createJoinRequest(req.user.id, apiaryId);
  }

  @Get('approve/:token')
  getApprovalInfo(@Param('token') token: string): Promise<JoinRequestInfo> {
    return this.service.getJoinRequestByApproveToken(token);
  }

  @Post('approve/:token')
  @HttpCode(HttpStatus.OK)
  approveJoinRequest(
    @Param('token') token: string,
    @Body('role') role: string,
  ): Promise<void> {
    return this.service.approveJoinRequest(token, role);
  }

  @Post('deny/:token')
  @HttpCode(HttpStatus.OK)
  denyJoinRequest(@Param('token') token: string): Promise<void> {
    return this.service.denyJoinRequest(token);
  }
}
