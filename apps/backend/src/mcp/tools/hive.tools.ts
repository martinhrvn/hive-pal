import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { hiveStatusSchema, queenStatusSchema } from 'shared-schemas';
import { HiveService } from '../../hives/hive.service';
import { QueensService } from '../../queens/queens.service';
import { McpScopeService } from '../mcp-scope.service';
import {
  McpContext,
  READ_ONLY,
  apiaryIdArg,
  jsonResult,
  registerTool,
} from '../mcp-context';

export interface HiveToolDeps {
  scope: McpScopeService;
  hives: HiveService;
  queens: QueensService;
}

export function registerHiveTools(
  server: McpServer,
  ctx: McpContext,
  deps: HiveToolDeps,
): void {
  registerTool(
    server,
    'list_hives',
    {
      title: 'List hives',
      description:
        'List hives with their status, apiary, current queen, last inspection and health score. Archived and dead hives are excluded unless includeInactive is set.',
      inputSchema: {
        apiaryId: apiaryIdArg,
        status: hiveStatusSchema.optional(),
        includeInactive: z.boolean().optional(),
      },
      annotations: READ_ONLY,
    },
    async ({ apiaryId, status, includeInactive }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      return jsonResult(
        await deps.hives.findAll({ ...filter, status, includeInactive }),
      );
    },
  );

  registerTool(
    server,
    'get_hive',
    {
      title: 'Get hive details',
      description:
        'Full details of one hive: boxes and frames, queen, settings, latest inspection data and score.',
      inputSchema: { hiveId: z.string().uuid() },
      annotations: READ_ONLY,
    },
    async ({ hiveId }) => {
      const filter = await deps.scope.resolve(ctx.userId);
      return jsonResult(await deps.hives.findOne(hiveId, filter));
    },
  );

  registerTool(
    server,
    'list_queens',
    {
      title: 'List queens',
      description:
        'List queens with their hive, marking, year, origin and status.',
      inputSchema: {
        apiaryId: apiaryIdArg,
        hiveId: z.string().uuid().optional(),
        status: queenStatusSchema.optional(),
      },
      annotations: READ_ONLY,
    },
    async ({ apiaryId, hiveId, status }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      return jsonResult(await deps.queens.findAll(filter, { hiveId, status }));
    },
  );
}
