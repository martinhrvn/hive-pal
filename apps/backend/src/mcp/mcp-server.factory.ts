import { Injectable } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiariesService } from '../apiaries/apiaries.service';
import { HiveService } from '../hives/hive.service';
import { QueensService } from '../queens/queens.service';
import { InspectionsService } from '../inspections/inspections.service';
import { ActionsService } from '../actions/actions.service';
import { CalendarService } from '../calendar/calendar.service';
import { TodosService } from '../todos/todos.service';
import { AlertsService } from '../alerts/alerts.service';
import { WeatherService } from '../weather/weather.service';
import { FeedTypesService } from '../users/feed-types.service';
import { McpScopeService } from './mcp-scope.service';
import { McpContext, publishFlatToolList } from './mcp-context';
import { registerApiaryTools } from './tools/apiary.tools';
import { registerHiveTools } from './tools/hive.tools';
import { registerInspectionTools } from './tools/inspection.tools';
import { registerTaskTools } from './tools/task.tools';

const INSTRUCTIONS = `Hive Pal is a beekeeping record keeper. Data is organised as apiaries → hives → inspections, queens and actions (feedings, treatments, …), plus a todo list and alerts.
Start with list_apiaries or list_hives to find ids. Read tools cover every apiary the user can access unless you pass an apiaryId.
Write tools change the user's records: confirm with the user before calling them.`;

/**
 * Builds a fresh MCP server per request (the transport is stateless), with the
 * tool set the access token's scopes allow.
 */
@Injectable()
export class McpServerFactory {
  constructor(
    private readonly scope: McpScopeService,
    private readonly apiaries: ApiariesService,
    private readonly hives: HiveService,
    private readonly queens: QueensService,
    private readonly inspections: InspectionsService,
    private readonly actions: ActionsService,
    private readonly calendar: CalendarService,
    private readonly todos: TodosService,
    private readonly alerts: AlertsService,
    private readonly weather: WeatherService,
    private readonly feedTypes: FeedTypesService,
  ) {}

  create(ctx: McpContext): McpServer {
    const server = new McpServer(
      { name: 'hive-pal', version: '1.0.0' },
      { instructions: INSTRUCTIONS },
    );
    const { scope } = this;
    registerApiaryTools(server, ctx, {
      apiaries: this.apiaries,
      weather: this.weather,
    });
    registerHiveTools(server, ctx, {
      scope,
      hives: this.hives,
      queens: this.queens,
    });
    registerInspectionTools(server, ctx, {
      scope,
      inspections: this.inspections,
      actions: this.actions,
      calendar: this.calendar,
      feedTypes: this.feedTypes,
    });
    registerTaskTools(server, ctx, {
      scope,
      todos: this.todos,
      alerts: this.alerts,
    });
    publishFlatToolList(server);
    return server;
  }
}
