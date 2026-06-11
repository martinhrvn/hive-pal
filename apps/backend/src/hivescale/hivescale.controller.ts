import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtService } from '@nestjs/jwt';
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
  HiveScaleTempCompensationFitDto,
} from './hivescale.service';

// SD backup uploads are fully buffered in memory (file.buffer), so cap the
// upload size to avoid excessive memory usage / DoS from oversized files.
// Overridable via env var to allow tuning without a code change.
const SD_IMPORT_MAX_FILE_SIZE = Number(
  process.env.HIVESCALE_SD_IMPORT_MAX_FILE_SIZE ?? 250 * 1024 * 1024,
);

@ApiTags('hivescale')
@Controller('hivescale')
@UseGuards(JwtAuthGuard)
export class HiveScaleController {
  constructor(
    private readonly hiveScaleService: HiveScaleService,
    private readonly jwtService: JwtService,
  ) {}

  private extractToken(req: RequestWithUser): string {
    const user = req.user;
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      passwordChangeRequired: user.passwordChangeRequired ?? false,
    });
  }

  @Post('devices/claim')
  claimDevice(
    @Req() req: RequestWithUser,
    @Body() payload: HiveScaleClaimDeviceDto,
  ) {
    return this.hiveScaleService.claimDevice(this.extractToken(req), payload);
  }

  @Get('devices')
  listDevices(@Req() req: RequestWithUser) {
    return this.hiveScaleService.listDevices(this.extractToken(req));
  }

  @Delete('devices/:deviceId')
  removeDevice(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.removeDevice(this.extractToken(req), deviceId);
  }

  @Get('devices/:deviceId/config')
  getDeviceConfig(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.getDeviceConfig(
      this.extractToken(req),
      deviceId,
    );
  }

  @Patch('devices/:deviceId/config')
  updateDeviceConfig(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body() payload: HiveScaleConfigPatchDto,
  ) {
    return this.hiveScaleService.updateDeviceConfig(
      this.extractToken(req),
      deviceId,
      payload,
    );
  }

  @Post('devices/:deviceId/temp-compensation/fit')
  fitTempCompensation(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body() payload: HiveScaleTempCompensationFitDto,
  ) {
    return this.hiveScaleService.fitTempCompensation(
      this.extractToken(req),
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
      this.extractToken(req),
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
      this.extractToken(req),
      deviceId,
      payload,
    );
  }

  @Post('devices/:deviceId/calibration/stop')
  stopCalibrationMode(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.stopCalibrationMode(
      this.extractToken(req),
      deviceId,
    );
  }

  @Post('devices/:deviceId/firmware')
  @UseInterceptors(FileInterceptor('file'))
  uploadFirmware(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { version?: string; target?: string; active?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No firmware file provided');
    }

    const target =
      body.target === 'beecounter' || body.target === 'hivescale'
        ? body.target
        : undefined;

    return this.hiveScaleService.uploadFirmware(
      this.extractToken(req),
      deviceId,
      file,
      {
        version: body.version ?? '',
        target,
        // Multipart fields arrive as strings; treat anything but "false" as true,
        // and default to true when omitted.
        active: body.active === undefined ? true : body.active !== 'false',
      },
    );
  }

  @Post('devices/:deviceId/measurements/import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: SD_IMPORT_MAX_FILE_SIZE },
    }),
  )
  importSdMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No SD data file provided');
    }

    return this.hiveScaleService.importSdMeasurements(
      this.extractToken(req),
      deviceId,
      file,
    );
  }

  @Get('devices/:deviceId/measurements')
  listMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query() query: HiveScaleMeasurementQuery,
  ) {
    return this.hiveScaleService.listMeasurements(
      this.extractToken(req),
      deviceId,
      query,
    );
  }

  @Get('devices/:deviceId/measurements/latest')
  latestMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.hiveScaleService.latestMeasurements(
      this.extractToken(req),
      deviceId,
      limit,
    );
  }

  @Get('devices/:deviceId/insights')
  getInsights(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('lookback_days') lookbackDays?: number,
  ) {
    return this.hiveScaleService.getDeviceInsights(
      this.extractToken(req),
      deviceId,
      lookbackDays !== undefined ? Number(lookbackDays) : undefined,
    );
  }

  @Get('devices/:deviceId/insights/summary')
  getInsightsSummary(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.getDeviceInsightsSummary(
      this.extractToken(req),
      deviceId,
    );
  }

  @Get('devices/:deviceId/insights/history')
  getInsightsHistory(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('status') status?: 'all' | 'active' | 'resolved',
    @Query('category') category?: string,
    @Query('since') since?: string,
    @Query('limit') limit?: number,
  ) {
    return this.hiveScaleService.getDeviceInsightsHistory(
      this.extractToken(req),
      deviceId,
      {
        status,
        category,
        since,
        limit: limit !== undefined ? Number(limit) : undefined,
      },
    );
  }

  @Get('devices/:deviceId/members')
  listMembers(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.listMembers(this.extractToken(req), deviceId);
  }

  @Post('devices/:deviceId/members')
  shareDevice(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body() payload: HiveScaleShareDeviceDto,
  ) {
    return this.hiveScaleService.shareDevice(
      this.extractToken(req),
      deviceId,
      payload,
    );
  }

  @Delete('devices/:deviceId/members/:memberUserId')
  revokeMember(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Param('memberUserId') memberUserId: string,
  ) {
    return this.hiveScaleService.revokeMember(
      this.extractToken(req),
      deviceId,
      memberUserId,
    );
  }
}
