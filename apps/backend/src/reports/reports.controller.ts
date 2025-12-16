import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
  BadRequestException,
  Header,
  StreamableFile,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { CustomLoggerService } from '../logger/logger.service';
import {
  ApiaryStatisticsDto,
  ApiaryTrendsDto,
  ReportPeriod,
} from './dto/apiary-statistics.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('ReportsController');
  }

  @Get('apiary/:apiaryId/statistics')
  async getApiaryStatistics(
    @Param('apiaryId') apiaryId: string,
    @Query('period') period: string = ReportPeriod.ALL,
    @Req() req: RequestWithUser,
  ): Promise<ApiaryStatisticsDto> {
    this.logger.log(
      `Getting statistics for apiary ${apiaryId}, period: ${period}, user: ${req.user.id}`,
    );

    // Validate period
    const validPeriods = Object.values(ReportPeriod);
    if (!validPeriods.includes(period as ReportPeriod)) {
      throw new BadRequestException(
        `Invalid period. Valid periods are: ${validPeriods.join(', ')}`,
      );
    }

    return this.reportsService.getApiaryStatistics(
      apiaryId,
      req.user.id,
      period as ReportPeriod,
    );
  }

  @Get('apiary/:apiaryId/trends')
  async getApiaryTrends(
    @Param('apiaryId') apiaryId: string,
    @Query('period') period: string = ReportPeriod.ALL,
    @Req() req: RequestWithUser,
  ): Promise<ApiaryTrendsDto> {
    this.logger.log(
      `Getting trends for apiary ${apiaryId}, period: ${period}, user: ${req.user.id}`,
    );

    // Validate period
    const validPeriods = Object.values(ReportPeriod);
    if (!validPeriods.includes(period as ReportPeriod)) {
      throw new BadRequestException(
        `Invalid period. Valid periods are: ${validPeriods.join(', ')}`,
      );
    }

    return this.reportsService.getTrends(
      apiaryId,
      req.user.id,
      period as ReportPeriod,
    );
  }

  @Get('apiary/:apiaryId/export/csv')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename="apiary-report.csv"')
  async exportCsv(
    @Param('apiaryId') apiaryId: string,
    @Query('period') period: string = ReportPeriod.ALL,
    @Req() req: RequestWithUser,
  ): Promise<string> {
    this.logger.log(
      `Exporting CSV for apiary ${apiaryId}, period: ${period}, user: ${req.user.id}`,
    );

    // Validate period
    const validPeriods = Object.values(ReportPeriod);
    if (!validPeriods.includes(period as ReportPeriod)) {
      throw new BadRequestException(
        `Invalid period. Valid periods are: ${validPeriods.join(', ')}`,
      );
    }

    return this.reportsService.exportCsv(
      apiaryId,
      req.user.id,
      period as ReportPeriod,
    );
  }

  @Get('apiary/:apiaryId/export/pdf')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="apiary-report.pdf"')
  async exportPdf(
    @Param('apiaryId') apiaryId: string,
    @Query('period') period: string = ReportPeriod.ALL,
    @Req() req: RequestWithUser,
  ): Promise<StreamableFile> {
    this.logger.log(
      `Exporting PDF for apiary ${apiaryId}, period: ${period}, user: ${req.user.id}`,
    );

    // Validate period
    const validPeriods = Object.values(ReportPeriod);
    if (!validPeriods.includes(period as ReportPeriod)) {
      throw new BadRequestException(
        `Invalid period. Valid periods are: ${validPeriods.join(', ')}`,
      );
    }

    const buffer = await this.reportsService.exportPdf(
      apiaryId,
      req.user.id,
      period as ReportPeriod,
    );
    return new StreamableFile(buffer);
  }
}
