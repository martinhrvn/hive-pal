import { Module } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { WeatherScheduler } from './weather.scheduler';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [ScheduleModule.forRoot()],
  providers: [WeatherService, WeatherScheduler, PrismaService],
  controllers: [WeatherController],
  exports: [WeatherService],
})
export class WeatherModule {}
