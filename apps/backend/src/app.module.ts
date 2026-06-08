import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { EnvController } from './env.controller';
import { BetterAuthModule } from './auth/better-auth.module';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppService } from './app.service';
import { HiveModule } from './hives/hive.module';
import { InspectionsModule } from './inspections/inspections.module';
import { BatchInspectionsModule } from './batch-inspections/batch-inspections.module';
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
import { FrameSizesModule } from './frame-sizes/frame-sizes.module';
import { MailModule } from './mail/mail.module';
import { SentryModule } from '@sentry/nestjs/setup';
import { ReportsModule } from './reports/reports.module';
import { StorageModule } from './storage/storage.module';
import { PlatformMetricsModule } from './platform-metrics/platform-metrics.module';
import { FeaturesModule } from './features/features.module';
import { QuickChecksModule } from './quick-checks/quick-checks.module';
import { SharesModule } from './shares/shares.module';
import { PhotosModule } from './photos/photos.module';
import { DocumentsModule } from './documents/documents.module';
import { InspectionAudioModule } from './inspection-audio/inspection-audio.module';
import { AiModule } from './ai/ai.module';
import { ApiarySharingModule } from './apiary-sharing/apiary-sharing.module';
import { WorkerTokensModule } from './worker-tokens/worker-tokens.module';
import { WorkerJobsModule } from './worker-jobs/worker-jobs.module';
import { AdminMediaModule } from './admin-media/admin-media.module';
import { HiveScaleModule } from './hivescale/hivescale.module';
import { AssistantModule } from './assistant/assistant.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { AccountTransferModule } from './account-transfer/account-transfer.module';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
      exclude: ['/api{/*path}'],
      renderPath: /^(?!\/assets\/)/,
    }),
    StorageModule,
    BetterAuthModule,
    HiveModule,
    InspectionsModule,
    BatchInspectionsModule,
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
    FrameSizesModule,
    MailModule,
    ReportsModule,
    PlatformMetricsModule,
    FeaturesModule,
    QuickChecksModule,
    SharesModule,
    PhotosModule,
    DocumentsModule,
    AiModule,
    InspectionAudioModule,
    ApiarySharingModule,
    WorkerTokensModule,
    WorkerJobsModule,
    AdminMediaModule,
    HiveScaleModule,
    AssistantModule,
    MeasurementsModule,
    AccountTransferModule,
  ],
  controllers: [AppController, EnvController],
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
