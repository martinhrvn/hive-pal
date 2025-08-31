import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiaryContextGuard } from '../guards/apiary-context.guard';
import { RequestWithApiary } from '../interface/request-with.apiary';
import { CalendarService } from './calendar.service';
import { CustomLoggerService } from '../logger/logger.service';
import { ZodValidation } from '../common';
import {
  calendarFilterSchema,
  CalendarFilter,
  CalendarResponse,
} from 'shared-schemas';

@UseGuards(JwtAuthGuard, ApiaryContextGuard)
@Controller('calendar')
export class CalendarController {
  constructor(
    private readonly calendarService: CalendarService,
    private readonly logger: CustomLoggerService,
  ) {
    this.logger.setContext('CalendarController');
  }

  @Get()
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
}
