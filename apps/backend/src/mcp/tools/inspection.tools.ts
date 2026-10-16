import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { NotFoundException } from '@nestjs/common';
import { z } from 'zod';
import {
  actionTypeSchema,
  createInspectionSchema,
  createStandaloneActionSchema,
  inspectionStatusSchema,
  isoDateTime,
} from 'shared-schemas';
import { InspectionsService } from '../../inspections/inspections.service';
import { ActionsService } from '../../actions/actions.service';
import { CalendarService } from '../../calendar/calendar.service';
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

export interface InspectionToolDeps {
  scope: McpScopeService;
  inspections: InspectionsService;
  actions: ActionsService;
  calendar: CalendarService;
}

const DEFAULT_LIMIT = 20;

const limitArg = z
  .number()
  .int()
  .min(1)
  .max(200)
  .optional()
  .describe(
    `Maximum number of results, newest first (default ${DEFAULT_LIMIT}).`,
  );

const dateRange = {
  startDate: isoDateTime().optional().describe('ISO 8601 date-time'),
  endDate: isoDateTime().optional().describe('ISO 8601 date-time'),
};

const CONFIRM_FIRST =
  'Summarise what will be recorded and get the user to confirm before calling this.';

export function registerInspectionTools(
  server: McpServer,
  ctx: McpContext,
  deps: InspectionToolDeps,
): void {
  registerTool(
    server,
    'list_inspections',
    {
      title: 'List inspections',
      description:
        'List hive inspections with observations (strength, brood, stores, temperament, queen sightings), notes and the actions taken, newest first.',
      inputSchema: {
        apiaryId: apiaryIdArg,
        hiveId: z.string().uuid().optional(),
        status: inspectionStatusSchema.optional(),
        ...dateRange,
        limit: limitArg,
      },
      annotations: READ_ONLY,
    },
    async ({ apiaryId, limit, ...filters }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      const inspections = await deps.inspections.findAll({
        ...filter,
        ...filters,
      });
      return jsonResult(inspections.slice(0, limit ?? DEFAULT_LIMIT));
    },
  );

  registerTool(
    server,
    'get_inspection',
    {
      title: 'Get inspection',
      description: 'One inspection with all observations, notes and actions.',
      inputSchema: { inspectionId: z.string().uuid() },
      annotations: READ_ONLY,
    },
    async ({ inspectionId }) => {
      const filter = await deps.scope.resolve(ctx.userId);
      const inspection = await deps.inspections.findOne(inspectionId, filter);
      if (!inspection) {
        throw new NotFoundException(
          `Inspection with ID ${inspectionId} not found`,
        );
      }
      return jsonResult(inspection);
    },
  );

  registerTool(
    server,
    'get_due_inspections',
    {
      title: 'Get due inspections',
      description: 'Scheduled inspections that are overdue or due today.',
      inputSchema: { apiaryId: apiaryIdArg },
      annotations: READ_ONLY,
    },
    async ({ apiaryId }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      const [overdue, dueToday] = await Promise.all([
        deps.inspections.findOverdueInspections(filter),
        deps.inspections.findDueTodayInspections(filter),
      ]);
      return jsonResult({ overdue, dueToday });
    },
  );

  registerTool(
    server,
    'list_actions',
    {
      title: 'List actions',
      description:
        'List actions taken on hives (feedings, treatments, frame changes, harvests, notes…), newest first.',
      inputSchema: {
        apiaryId: apiaryIdArg,
        hiveId: z.string().uuid().optional(),
        type: actionTypeSchema.optional(),
        ...dateRange,
        limit: limitArg,
      },
      annotations: READ_ONLY,
    },
    async ({ apiaryId, limit, ...filters }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      const actions = await deps.actions.findAll({ ...filter, ...filters });
      return jsonResult(actions.slice(0, limit ?? DEFAULT_LIMIT));
    },
  );

  registerTool(
    server,
    'get_calendar',
    {
      title: 'Get calendar',
      description:
        'Inspections and standalone actions grouped by day over a date range.',
      inputSchema: {
        apiaryId: apiaryIdArg,
        hiveId: z.string().uuid().optional(),
        ...dateRange,
      },
      annotations: READ_ONLY,
    },
    async ({ apiaryId, ...filters }) => {
      const filter = await deps.scope.resolve(ctx.userId, apiaryId);
      return jsonResult(
        await deps.calendar.getCalendarEvents({ ...filter, ...filters }),
      );
    },
  );

  if (!canWrite(ctx)) return;

  registerTool(
    server,
    'create_inspection',
    {
      title: 'Record inspection',
      description: `Record a hive inspection, optionally with observations and actions taken during it (e.g. feeding, treatment). Use a past or current date for a completed inspection, a future one to schedule it. ${CONFIRM_FIRST}`,
      inputSchema: createInspectionSchema.omit({ id: true }).shape,
      annotations: WRITE,
    },
    async (input) => {
      const filter = await deps.scope.resolve(ctx.userId);
      return jsonResult(await deps.inspections.create(input, filter));
    },
  );

  registerTool(
    server,
    'record_action',
    {
      title: 'Record action',
      description: `Record a standalone action on a hive outside an inspection, such as a feeding, treatment or note. ${CONFIRM_FIRST}`,
      inputSchema: createStandaloneActionSchema.shape,
      annotations: WRITE,
    },
    async (input) => {
      const filter = await deps.scope.resolve(ctx.userId);
      return jsonResult(
        await deps.actions.createStandaloneAction(input, filter),
      );
    },
  );
}
