import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ApiariesService } from '../../apiaries/apiaries.service';
import { WeatherService } from '../../weather/weather.service';
import {
  McpContext,
  READ_ONLY,
  jsonResult,
  registerTool,
} from '../mcp-context';

export interface ApiaryToolDeps {
  apiaries: ApiariesService;
  weather: WeatherService;
}

export function registerApiaryTools(
  server: McpServer,
  ctx: McpContext,
  deps: ApiaryToolDeps,
): void {
  registerTool(
    server,
    'list_apiaries',
    {
      title: 'List apiaries',
      description:
        'List the apiaries the user owns or is a member of, with their ids, locations and hive counts. Call this first to find apiary ids for other tools.',
      annotations: READ_ONLY,
    },
    async () => jsonResult(await deps.apiaries.findAll(ctx.userId)),
  );

  registerTool(
    server,
    'get_weather',
    {
      title: 'Get apiary weather',
      description:
        "Current weather and the 7-day daily forecast at an apiary's location. Empty when the apiary has no coordinates set.",
      inputSchema: { apiaryId: z.string().uuid() },
      annotations: READ_ONLY,
    },
    async ({ apiaryId }) => {
      await deps.weather.assertApiaryReadable(apiaryId, ctx.userId);
      const [current, dailyForecast] = await Promise.all([
        deps.weather.getCurrentWeather(apiaryId),
        deps.weather.getDailyForecast(apiaryId),
      ]);
      return jsonResult({ current, dailyForecast });
    },
  );
}
