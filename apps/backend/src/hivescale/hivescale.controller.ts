import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import {
  HIVEHUB_MAX_HIVES,
  hiveHubCalibrationModeStartSchema,
  hiveHubChannelsPatchSchema,
  hiveHubClaimDeviceSchema,
  hiveHubConfigPatchSchema,
  hiveHubInspectionStartSchema,
  hiveHubInspectionStopSchema,
  hiveHubInspectionUpdateSchema,
  hiveHubMeasurementDeleteSchema,
  hiveHubMeasurementQuerySchema,
  hiveHubRecordingRequestSchema,
  hiveHubShareDeviceSchema,
  hiveHubTempCompensationFitSchema,
  type HiveHubCalibrationModeStart,
  type HiveHubChannelsPatch,
  type HiveHubClaimDevice,
  type HiveHubConfigPatch,
  type HiveHubInspectionStart,
  type HiveHubInspectionStop,
  type HiveHubInspectionUpdate,
  type HiveHubMeasurementDelete,
  type HiveHubMeasurementQuery,
  type HiveHubRecordingRequest,
  type HiveHubShareDevice,
  type HiveHubTempCompensationFit,
} from 'shared-schemas';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  HIVEHUB_FIRMWARE_BOARDS,
  HIVEHUB_FIRMWARE_TARGETS,
  HiveHubStream,
  HiveScaleFirmwareBoard,
  HiveScaleFirmwareTarget,
  HiveScaleService,
} from './hivescale.service';

// SD backup uploads are fully buffered in memory (file.buffer), so cap the
// upload size to avoid excessive memory usage / DoS from oversized files.
// Overridable via env var to allow tuning without a code change.
const SD_IMPORT_MAX_FILE_SIZE = Number(
  process.env.HIVESCALE_SD_IMPORT_MAX_FILE_SIZE ?? 250 * 1024 * 1024,
);

// Firmware images are buffered in memory too. HiveHub itself refuses anything
// over MAX_FIRMWARE_BYTES (16 MB by default), so reject bigger files here
// before they are read into memory and forwarded.
const FIRMWARE_MAX_FILE_SIZE = Number(
  process.env.HIVEHUB_FIRMWARE_MAX_FILE_SIZE ?? 16 * 1024 * 1024,
);

/**
 * Firmware relays target the sub-device paired with one hive, 1..18. Default
 * to hive 1 when omitted and reject anything else.
 */
export function parseRelaySlot(raw?: string): number {
  if (raw === undefined || raw === '') return 1;
  const slot = Number(raw);
  if (!Number.isInteger(slot) || slot < 1 || slot > HIVEHUB_MAX_HIVES) {
    throw new BadRequestException(
      `slot must be a hive index between 1 and ${HIVEHUB_MAX_HIVES}`,
    );
  }
  return slot;
}

/** Query/multipart booleans arrive as strings. */
function parseFlag(raw?: string): boolean {
  return raw === 'true' || raw === '1';
}

function optionalInt(raw?: string): number | undefined {
  if (raw === undefined || raw === '') return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new BadRequestException(`Expected an integer, got "${raw}"`);
  }
  return value;
}

/** Copy HiveHub's stream headers onto the reply and hand the body to Nest. */
function toStreamableFile(
  res: Response,
  upstream: HiveHubStream,
  fallbackFilename: string,
): StreamableFile {
  res.setHeader('Content-Type', upstream.contentType);
  if (upstream.contentLength) {
    res.setHeader('Content-Length', upstream.contentLength);
  }
  res.setHeader(
    'Content-Disposition',
    upstream.contentDisposition ?? `attachment; filename="${fallbackFilename}"`,
  );
  res.setHeader('Cache-Control', 'no-store');
  return new StreamableFile(upstream.stream);
}

@ApiTags('hivescale')
@Controller('hivescale')
@UseGuards(JwtAuthGuard)
export class HiveScaleController {
  constructor(private readonly hiveScaleService: HiveScaleService) {}

  private extractToken(req: RequestWithUser): string {
    return this.hiveScaleService.tokenFor(req.user);
  }

  @Post('devices/claim')
  claimDevice(
    @Req() req: RequestWithUser,
    @Body(new ZodValidationPipe(hiveHubClaimDeviceSchema))
    payload: HiveHubClaimDevice,
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

  @Delete('devices/:deviceId/claim')
  releaseDevice(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.releaseDevice(
      this.extractToken(req),
      deviceId,
    );
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
    @Body(new ZodValidationPipe(hiveHubConfigPatchSchema))
    payload: HiveHubConfigPatch,
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
    @Body(new ZodValidationPipe(hiveHubTempCompensationFitSchema))
    payload: HiveHubTempCompensationFit,
  ) {
    return this.hiveScaleService.fitTempCompensation(
      this.extractToken(req),
      deviceId,
      payload,
    );
  }

  @Get('devices/:deviceId/channels')
  getDeviceChannels(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.getDeviceChannels(
      this.extractToken(req),
      deviceId,
    );
  }

  @Patch('devices/:deviceId/channels')
  updateDeviceChannels(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body(new ZodValidationPipe(hiveHubChannelsPatchSchema))
    payload: HiveHubChannelsPatch,
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
    @Body(new ZodValidationPipe(hiveHubCalibrationModeStartSchema))
    payload: HiveHubCalibrationModeStart,
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

  @Post('devices/:deviceId/provisioning/start')
  startProvisioning(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.startProvisioning(
      this.extractToken(req),
      deviceId,
    );
  }

  @Post('devices/:deviceId/firmware')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: FIRMWARE_MAX_FILE_SIZE } }),
  )
  uploadFirmware(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      version?: string;
      target?: string;
      board?: string;
      active?: string;
    },
  ) {
    if (!file) {
      throw new BadRequestException('No firmware file provided');
    }

    const target = body.target?.trim().toLowerCase();
    if (
      target &&
      !HIVEHUB_FIRMWARE_TARGETS.includes(target as HiveScaleFirmwareTarget)
    ) {
      throw new BadRequestException(
        "target must be 'hivehub', 'beecounter' or 'hiveinside'",
      );
    }
    const board = body.board?.trim().toLowerCase();
    if (
      board &&
      !HIVEHUB_FIRMWARE_BOARDS.includes(board as HiveScaleFirmwareBoard)
    ) {
      throw new BadRequestException(
        `board must be one of ${HIVEHUB_FIRMWARE_BOARDS.join(', ')}`,
      );
    }

    return this.hiveScaleService.uploadFirmware(
      this.extractToken(req),
      deviceId,
      file,
      {
        version: body.version ?? '',
        target: (target || undefined) as HiveScaleFirmwareTarget | undefined,
        board: (board || undefined) as HiveScaleFirmwareBoard | undefined,
        // Multipart fields arrive as strings; treat anything but "false" as true,
        // and default to true when omitted.
        active: body.active === undefined ? true : body.active !== 'false',
      },
    );
  }

  @Get('devices/:deviceId/firmware/status')
  getFirmwareStatus(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.getFirmwareStatus(
      this.extractToken(req),
      deviceId,
    );
  }

  @Post('devices/:deviceId/firmware/approve')
  approveFirmware(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.approveFirmware(
      this.extractToken(req),
      deviceId,
    );
  }

  @Post('devices/:deviceId/commands/update-hiveinside')
  queueHiveInsideUpdate(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('slot') slot?: string,
    @Query('force') force?: string,
  ) {
    return this.hiveScaleService.queueHiveInsideUpdate(
      this.extractToken(req),
      deviceId,
      parseRelaySlot(slot),
      parseFlag(force),
    );
  }

  @Post('devices/:deviceId/commands/update-beecounter')
  queueBeeCounterUpdate(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('slot') slot?: string,
    @Query('force') force?: string,
  ) {
    return this.hiveScaleService.queueBeeCounterUpdate(
      this.extractToken(req),
      deviceId,
      parseRelaySlot(slot),
      parseFlag(force),
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
    @Body() body: { force?: string },
  ) {
    if (!file) {
      throw new BadRequestException('No SD data file provided');
    }

    return this.hiveScaleService.importSdMeasurements(
      this.extractToken(req),
      deviceId,
      file,
      { force: parseFlag(body?.force) },
    );
  }

  @Post('devices/:deviceId/measurements/delete')
  deleteMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body(new ZodValidationPipe(hiveHubMeasurementDeleteSchema))
    payload: HiveHubMeasurementDelete,
  ) {
    return this.hiveScaleService.deleteMeasurements(
      this.extractToken(req),
      deviceId,
      payload,
    );
  }

  @Get('devices/:deviceId/export/measurements/summary')
  exportSummary(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('start_at') startAt?: string,
    @Query('end_at') endAt?: string,
  ) {
    return this.hiveScaleService.exportSummary(
      this.extractToken(req),
      deviceId,
      { start_at: startAt || undefined, end_at: endAt || undefined },
    );
  }

  @Get('devices/:deviceId/export/measurements')
  async exportMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Res({ passthrough: true }) res: Response,
    @Query('start_at') startAt?: string,
    @Query('end_at') endAt?: string,
    @Query('hive') hive?: string | string[],
  ) {
    const hives = (Array.isArray(hive) ? hive : hive ? [hive] : []).map(
      (value) => parseRelaySlot(value),
    );
    const upstream = await this.hiveScaleService.exportMeasurements(
      this.extractToken(req),
      deviceId,
      {
        start_at: startAt || undefined,
        end_at: endAt || undefined,
        hive: hives.length > 0 ? hives : undefined,
      },
    );
    return toStreamableFile(res, upstream, `${deviceId}-measurements.ndjson`);
  }

  @Get('devices/:deviceId/measurements')
  listMeasurements(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query(new ZodValidationPipe(hiveHubMeasurementQuerySchema, 'query'))
    query: HiveHubMeasurementQuery,
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
    @Query('limit') limit?: string,
  ) {
    return this.hiveScaleService.latestMeasurements(
      this.extractToken(req),
      deviceId,
      optionalInt(limit),
    );
  }

  @Get('devices/:deviceId/insights')
  getInsights(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('lookback_days') lookbackDays?: string,
  ) {
    return this.hiveScaleService.getDeviceInsights(
      this.extractToken(req),
      deviceId,
      optionalInt(lookbackDays),
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
    @Query('limit') limit?: string,
  ) {
    return this.hiveScaleService.getDeviceInsightsHistory(
      this.extractToken(req),
      deviceId,
      {
        status,
        category,
        since,
        limit: optionalInt(limit),
      },
    );
  }

  @Get('devices/:deviceId/inspections/status')
  getInspectionStatus(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
  ) {
    return this.hiveScaleService.getInspectionStatus(
      this.extractToken(req),
      deviceId,
    );
  }

  @Get('devices/:deviceId/inspections')
  listInspections(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('start_at') startAt?: string,
    @Query('end_at') endAt?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hiveScaleService.listInspections(
      this.extractToken(req),
      deviceId,
      {
        start_at: startAt || undefined,
        end_at: endAt || undefined,
        limit: optionalInt(limit),
      },
    );
  }

  @Post('devices/:deviceId/inspections/start')
  startInspection(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body(new ZodValidationPipe(hiveHubInspectionStartSchema))
    payload: HiveHubInspectionStart,
  ) {
    return this.hiveScaleService.startInspection(
      this.extractToken(req),
      deviceId,
      payload,
    );
  }

  @Post('devices/:deviceId/inspections/stop')
  stopInspection(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Body(new ZodValidationPipe(hiveHubInspectionStopSchema))
    payload: HiveHubInspectionStop,
  ) {
    return this.hiveScaleService.stopInspection(
      this.extractToken(req),
      deviceId,
      payload,
    );
  }

  @Patch('devices/:deviceId/inspections/:inspectionId')
  updateInspection(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Param('inspectionId', ParseIntPipe) inspectionId: number,
    @Body(new ZodValidationPipe(hiveHubInspectionUpdateSchema))
    payload: HiveHubInspectionUpdate,
  ) {
    return this.hiveScaleService.updateInspection(
      this.extractToken(req),
      deviceId,
      inspectionId,
      payload,
    );
  }

  @Get('devices/:deviceId/recordings')
  listRecordings(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query('hive') hive?: string,
    @Query('limit') limit?: string,
  ) {
    return this.hiveScaleService.listRecordings(
      this.extractToken(req),
      deviceId,
      {
        hive: hive ? parseRelaySlot(hive) : undefined,
        limit: optionalInt(limit),
      },
    );
  }

  @Post('devices/:deviceId/recordings')
  requestRecording(
    @Req() req: RequestWithUser,
    @Param('deviceId') deviceId: string,
    @Query(new ZodValidationPipe(hiveHubRecordingRequestSchema, 'query'))
    query: HiveHubRecordingRequest,
  ) {
    return this.hiveScaleService.requestRecording(
      this.extractToken(req),
      deviceId,
      query,
    );
  }

  @Get('recordings/:recordingId')
  getRecording(
    @Req() req: RequestWithUser,
    @Param('recordingId', ParseIntPipe) recordingId: number,
  ) {
    return this.hiveScaleService.getRecording(
      this.extractToken(req),
      recordingId,
    );
  }

  @Get('recordings/:recordingId/audio.wav')
  async recordingWav(
    @Req() req: RequestWithUser,
    @Param('recordingId', ParseIntPipe) recordingId: number,
    @Res({ passthrough: true }) res: Response,
  ) {
    const upstream = await this.hiveScaleService.recordingWav(
      this.extractToken(req),
      recordingId,
    );
    return toStreamableFile(res, upstream, `recording-${recordingId}.wav`);
  }

  @Delete('recordings/:recordingId')
  deleteRecording(
    @Req() req: RequestWithUser,
    @Param('recordingId', ParseIntPipe) recordingId: number,
  ) {
    return this.hiveScaleService.deleteRecording(
      this.extractToken(req),
      recordingId,
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
    @Body(new ZodValidationPipe(hiveHubShareDeviceSchema))
    payload: HiveHubShareDevice,
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
