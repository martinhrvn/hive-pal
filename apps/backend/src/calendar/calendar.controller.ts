import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Req,
  Header,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { RequestWithUser } from '../auth/interface/request-with-user.interface';
import { CalendarService } from './calendar.service';
import { ICalService } from './ical.service';
import { ICalTokenService } from './ical-token.service';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  calendarFilterSchema,
  CalendarFilter,
  CalendarResponse,
  SubscriptionUrlResponse,
} from 'shared-schemas';
import { PrismaService } from '../prisma/prisma.service';

@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly icalService: ICalService,
    private readonly icalTokenService: ICalTokenService,
    private readonly prisma: PrismaService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('CalendarController');
  }

  @Get()
  @UseGuards(JwtAuthGuard, ApiaryContextGuard)
  @ZodValidation(calendarFilterSchema)
  async getCalendarEvents(
    @Query() query: CalendarFilter,
    @Req() req: RequestWithApiary,
  ): Promise<CalendarResponse> {
    this.logger.log(
      `Getting calendar events for apiary ${req.apiaryId}${query.hiveId ? `, hive ${query.hiveId}` : ''}`,
    );

    return this.calendarService.getCalendarEvents({
      ...query,
      apiaryId: req.apiaryId,
      userId: req.user.id,
    });
  }

  @Get('apiary/:apiaryId/subscription')
  @UseGuards(JwtAuthGuard)
  async getSubscriptionUrl(
    @Param('apiaryId') apiaryId: string,
    @Req() req: RequestWithUser & Request,
  ): Promise<SubscriptionUrlResponse> {
    this.logger.log(
      `Getting subscription URL for apiary ${apiaryId}, user ${req.user.id}`,
    );

    // Validate user owns this apiary
    const apiary = await this.prisma.apiary.findFirst({
      where: {
        id: apiaryId,
        userId: req.user.id,
      },
    });

    if (!apiary) {
      throw new NotFoundException('Apiary not found');
    }

    // Generate token
    const token = this.icalTokenService.generateSubscriptionToken(
      req.user.id,
      apiaryId,
    );

    // Build subscription URL
    const forwardedProto = req.headers['x-forwarded-proto'];
    const protocol =
      (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) ||
      req.protocol ||
      'http';
    const forwardedHost = req.headers['x-forwarded-host'];
    const host =
      (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) ||
      req.get('host') ||
      'localhost';
    const baseUrl = `${protocol}://${host}`;
    const subscriptionUrl = `${baseUrl}/api/calendar/apiary/${apiaryId}/ical.ics?token=${token}`;

    // Token expires in 365 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 365);

    return {
      subscriptionUrl,
      expiresAt: expiresAt.toISOString(),
    };
  }

  @Post('apiary/:apiaryId/subscription/regenerate')
  @UseGuards(JwtAuthGuard)
  async regenerateSubscriptionUrl(
    @Param('apiaryId') apiaryId: string,
    @Req() req: RequestWithUser & Request,
  ): Promise<SubscriptionUrlResponse> {
    this.logger.log(
      `Regenerating subscription URL for apiary ${apiaryId}, user ${req.user.id}`,
    );

    // Same logic as getSubscriptionUrl - generates a new token
    return this.getSubscriptionUrl(apiaryId, req);
  }

  @Get('apiary/:apiaryId/ical.ics')
  @Header('Content-Type', 'text/calendar; charset=utf-8')
  @Header('Content-Disposition', 'inline; filename="hivepal-calendar.ics"')
  @Header('Cache-Control', 'no-cache, no-store, must-revalidate')
  async getICalFeed(
    @Param('apiaryId') apiaryId: string,
    @Query('token') token: string,
  ): Promise<string> {
    this.logger.log(`Fetching iCal feed for apiary ${apiaryId}`);

    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    // Validate token
    const tokenData = this.icalTokenService.validateSubscriptionToken(token);

    if (!tokenData) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Validate token is for this apiary
    if (tokenData.apiaryId !== apiaryId) {
      throw new UnauthorizedException('Token is not valid for this apiary');
    }

    // Generate iCal content
    return this.icalService.generateICalForApiary(apiaryId, tokenData.userId);
  }
}
