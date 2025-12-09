import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppService } from './app.service';
import { HiveModule } from './hives/hive.module';
import { InspectionsModule } from './inspections/inspections.module';
import { QueensModule } from './queens/queens.module';
import { MetricsService } from './metrics/metrics.service';
import { UsersModule } from './users/users.module';
import { ApiariesModule } from './apiaries/apiaries.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './global-exception.filter';
import { LoggerModule } from './logger/logger.module';
import { HealthModule } from './health/health.module';
import { PrometheusInterceptor } from './health/prometheus/prometheus.interceptor';
import { PrometheusModule } from './health/prometheus/prometheus.module';
import { ActionsModule } from './actions/actions.module';
import { WeatherModule } from './weather/weather.module';
import { HarvestsModule } from './harvests/harvests.module';
import { AlertsModule } from './alerts/alerts.module';
import { CalendarModule } from './calendar/calendar.module';
import { FeedbackModule } from './feedback/feedback.module';
import { MailModule } from './mail/mail.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    AuthModule,
    HiveModule,
    InspectionsModule,
    QueensModule,
    UsersModule,
    ApiariesModule,
    LoggerModule,
    HealthModule,
    PrometheusModule,
    ActionsModule,
    WeatherModule,
    HarvestsModule,
    AlertsModule,
    CalendarModule,
    FeedbackModule,
    MailModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MetricsService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: PrometheusInterceptor,
    },
  ],
})
export class AppModule {}
