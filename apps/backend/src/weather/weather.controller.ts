import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('weather')
@Controller('weather')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('apiary/:apiaryId/current')
  @ApiOperation({ summary: 'Get current weather for an apiary' })
  async getCurrentWeather(@Param('apiaryId') apiaryId: string) {
    return this.weatherService.getCurrentWeather(apiaryId);
  }

  @Get('apiary/:apiaryId/forecast')
  @ApiOperation({ summary: 'Get 5-day forecast for an apiary' })
  async getForecast(@Param('apiaryId') apiaryId: string) {
    return this.weatherService.getForecast(apiaryId);
  }
}
