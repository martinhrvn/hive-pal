import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import {
  HiveScaleClaimDeviceDto,
  HiveScaleConfigPatchDto,
  HiveScaleMeasurementQuery,
  HiveScaleService,
} from './hivescale.service';

@ApiTags('hivescale')
@Controller('hivescale')
@UseGuards(JwtAuthGuard)
export class HiveScaleController {
  constructor(private readonly hiveScaleService: HiveScaleService) {}

  @Post('devices/claim')
  claimDevice(
    @Req() req: RequestWithUser,
    @Body() payload: HiveScaleClaimDeviceDto,
  ) {
    return this.hiveScaleService.claimDevice(req.user.id, payload);
  }

  @Get('devices')
  listDevices(@Req() req: RequestWithUser) {
    return this.hiveScaleService.listDevices(req.user.id);
  }

  @Get('devices/:deviceId/config')
  getDeviceConfig(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.getDeviceConfig(req.user.id, deviceId);
  }

  @Patch('devices/:deviceId/config')
  updateDeviceConfig(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body() payload: HiveScaleConfigPatchDto,
  ) {
    return this.hiveScaleService.updateDeviceConfig(
      req.user.id,
      deviceId,
      payload,
    );
  }

  @Get('devices/:deviceId/measurements')
  listMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query() query: HiveScaleMeasurementQuery,
  ) {
    return this.hiveScaleService.listMeasurements(req.user.id, deviceId, query);
  }

  @Get('devices/:deviceId/measurements/latest')
  latestMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.hiveScaleService.latestMeasurements(req.user.id, deviceId, limit);
  }
}
