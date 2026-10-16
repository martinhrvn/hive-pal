import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import {
  alertSeveritySchema,
  alertStatusSchema,
  createTodoSchema,
  updateTodoSchema,
} from 'shared-schemas';
import { TodosService } from '../../todos/todos.service';
import { AlertsService } from '../../alerts/alerts.service';
import { McpScopeService } from '../mcp-scope.service';
import {
  McpContext,
  READ_ONLY,
  WRITE,
  apiaryIdArg,
  canWrite,
  jsonResult,
  registerTool,
} from '../mcp-context';

export interface TaskToolDeps {
  scope: McpScopeService;
  todos: TodosService;
  alerts: AlertsService;
}

export function registerTaskTools(
  server: McpServer,
  ctx: McpContext,
  deps: TaskToolDeps,
): void {
  registerTool(
    server,
    'list_todos',
    {
      title: 'List todos',
      description:
        'List the beekeeping todo list, open items first, ordered by due date.',
      inputSchema: {
        apiaryId: apiaryIdArg,
        hiveId: z.string().uuid().optional(),
        completed: z.boolean().optional(),
      },
      annotations: READ_ONLY,
    },
    async ({ apiaryId, hiveId, completed }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      return jsonResult(
        await deps.todos.findAll(filter, { hiveId, completed }),
      );
    },
  );

  registerTool(
    server,
    'list_alerts',
    {
      title: 'List alerts',
      description:
        'List hive alerts raised by Hive Pal, such as a queenless colony, an overdue treatment or low stores.',
      inputSchema: {
        apiaryId: apiaryIdArg,
        hiveId: z.string().uuid().optional(),
        status: alertStatusSchema.optional(),
        severity: alertSeveritySchema.optional(),
      },
      annotations: READ_ONLY,
    },
    async ({ apiaryId, ...filters }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      return jsonResult(
        await deps.alerts.findAll({
          ...filter,
          ...filters,
          includeSuperseded: false,
        }),
      );
    },
  );

  if (!canWrite(ctx)) return;

  registerTool(
    server,
    'create_todo',
    {
      title: 'Create todo',
      description:
        'Add an item to the todo list. Set hiveId for a hive task; otherwise apiaryId is required. Confirm the wording with the user first.',
      inputSchema: {
        ...createTodoSchema.shape,
        apiaryId: z
          .string()
          .uuid()
          .optional()
          .describe('Apiary for a todo not tied to a hive.'),
      },
      annotations: WRITE,
    },
    async ({ apiaryId, ...todo }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      return jsonResult(await deps.todos.create(todo, filter));
    },
  );

  registerTool(
    server,
    'update_todo',
    {
      title: 'Update todo',
      description:
        'Change a todo item, e.g. mark it done with completed: true or move its due date.',
      inputSchema: { todoId: z.string().uuid(), ...updateTodoSchema.shape },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async ({ todoId, ...changes }) => {
      const filter = await deps.scope.resolve(ctx.userId);
      return jsonResult(await deps.todos.update(todoId, changes, filter));
    },
  );

  registerTool(
    server,
    'dismiss_alert',
    {
      title: 'Dismiss alert',
      description:
        'Dismiss an alert the user has dealt with or wants to ignore. Confirm with the user first.',
      inputSchema: { alertId: z.string().uuid() },
      annotations: { ...WRITE, idempotentHint: true },
    },
    async ({ alertId }) => {
      const filter = await deps.scope.resolve(ctx.userId);
      return jsonResult(await deps.alerts.dismiss(alertId, filter));
    },
  );
}
