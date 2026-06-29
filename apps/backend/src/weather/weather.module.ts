import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { WeatherScheduler } from './weather.scheduler';
import { WeatherEventHandler } from './weather.event-handler';
import { PrismaService } from '../prisma/prisma.service';
import { PrometheusModule } from '../health/prometheus/prometheus.module';

@Module({
  imports: [PrometheusModule],
  providers: [
    WeatherService,
    WeatherScheduler,
    WeatherEventHandler,
    PrismaService,
  ],
  controllers: [WeatherController],
  exports: [WeatherService],
})
export class WeatherModule {}
