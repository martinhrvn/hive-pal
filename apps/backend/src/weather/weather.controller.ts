import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('current/:apiaryId')
  @ApiOperation({ summary: 'Get current weather for an apiary' })
  async getCurrentWeather(@Param('apiaryId') apiaryId: string) {
    return this.weatherService.getCurrentWeather(apiaryId);
  }

  @Get('hourly-forecast/:apiaryId')
  @ApiOperation({ summary: 'Get 5-hour hourly forecast for an apiary' })
  async getHourlyForecast(@Param('apiaryId') apiaryId: string) {
    return this.weatherService.getHourlyForecast(apiaryId);
  }

  @Get('daily-forecast/:apiaryId')
  @ApiOperation({ summary: 'Get 7-day daily forecast for an apiary' })
  async getDailyForecast(@Param('apiaryId') apiaryId: string) {
    return this.weatherService.getDailyForecast(apiaryId);
  }

  @Get('history/:apiaryId')
  @ApiOperation({ summary: 'Get weather history for an apiary' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Maximum number of records' })
  async getWeatherHistory(
    @Param('apiaryId') apiaryId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: string,
  ) {
    const numLimit = limit ? parseInt(limit, 10) : undefined;
    return this.weatherService.getWeatherHistory(apiaryId, startDate, endDate, numLimit);
  }

  // Legacy endpoint for backward compatibility
  @Get('forecast/:apiaryId')
  @ApiOperation({ summary: 'Get 5-day forecast for an apiary (now returns daily forecast)' })
  async getForecast(@Param('apiaryId') apiaryId: string) {
    return this.weatherService.getDailyForecast(apiaryId);
  }
}
