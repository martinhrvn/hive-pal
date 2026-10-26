import { Module } from '@nestjs/common';
import { ApiariesModule } from '../apiaries/apiaries.module';
import { HiveModule } from '../hives/hive.module';
import { QueensModule } from '../queens/queens.module';
import { InspectionsModule } from '../inspections/inspections.module';
import { ActionsModule } from '../actions/actions.module';
import { CalendarModule } from '../calendar/calendar.module';
import { TodosModule } from '../todos/todos.module';
import { AlertsModule } from '../alerts/alerts.module';
import { WeatherModule } from '../weather/weather.module';
import { UsersModule } from '../users/users.module';
import { McpController } from './mcp.controller';
import { WellKnownController } from './well-known.controller';
import { McpServerFactory } from './mcp-server.factory';
import { McpScopeService } from './mcp-scope.service';

@Module({
  imports: [
    ApiariesModule,
    HiveModule,
    QueensModule,
    InspectionsModule,
    ActionsModule,
    CalendarModule,
    TodosModule,
    AlertsModule,
    WeatherModule,
    UsersModule,
  ],
  controllers: [McpController, WellKnownController],
  providers: [McpServerFactory, McpScopeService],
})
export class McpModule {}
