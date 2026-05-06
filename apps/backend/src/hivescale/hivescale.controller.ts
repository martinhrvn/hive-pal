import {
  Body,
  Controller,
  Delete,
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
  HiveScaleCalibrationModeStartDto,
  HiveScaleChannelsPatchDto,
  HiveScaleClaimDeviceDto,
  HiveScaleConfigPatchDto,
  HiveScaleMeasurementQuery,
  HiveScaleService,
  HiveScaleShareDeviceDto,
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

  @Delete('devices/:deviceId')
  removeDevice(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.removeDevice(req.user.id, deviceId);
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

  @Patch('devices/:deviceId/channels')
  updateDeviceChannels(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body() payload: HiveScaleChannelsPatchDto,
  ) {
    return this.hiveScaleService.updateDeviceChannels(
      req.user.id,
      deviceId,
      payload,
    );
  }

  @Post('devices/:deviceId/calibration/start')
  startCalibrationMode(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body() payload: HiveScaleCalibrationModeStartDto,
  ) {
    return this.hiveScaleService.startCalibrationMode(
      req.user.id,
      deviceId,
      payload,
    );
  }

  @Post('devices/:deviceId/calibration/stop')
  stopCalibrationMode(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.stopCalibrationMode(req.user.id, deviceId);
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
    return this.hiveScaleService.latestMeasurements(
      req.user.id,
      deviceId,
      limit,
    );
  }

  @Get('devices/:deviceId/members')
  listMembers(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.listMembers(req.user.id, deviceId);
  }

  @Post('devices/:deviceId/members')
  shareDevice(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body() payload: HiveScaleShareDeviceDto,
  ) {
    return this.hiveScaleService.shareDevice(req.user.id, deviceId, payload);
  }

  @Delete('devices/:deviceId/members/:memberUserId')
  revokeMember(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.hiveScaleService.revokeMember(
      req.user.id,
      deviceId,
      memberUserId,
    );
  }
}
