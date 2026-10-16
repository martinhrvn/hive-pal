import {
  ListToolsRequestSchema,
  type CallToolResult,
  type Tool,
  type ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { MCP_WRITE_SCOPE } from '../auth/mcp-config';
import { simplifyJsonSchema } from './json-schema';

/** The user an MCP request acts for, taken from the verified access token. */
export interface McpContext {
  userId: string;
  scopes: ReadonlySet<string>;
}

export const canWrite = (ctx: McpContext): boolean =>
  ctx.scopes.has(MCP_WRITE_SCOPE);

/** Parses the `scope` claim, which is a space-separated string per RFC 9068. */
export const parseScopes = (scope: unknown): Set<string> => {
  if (Array.isArray(scope)) return new Set(scope.map(String));
  if (typeof scope === 'string')
    return new Set(scope.split(' ').filter(Boolean));
  return new Set();
};

export const jsonResult = (data: unknown): CallToolResult => ({
  content: [{ type: 'text', text: JSON.stringify(data ?? null, null, 2) }],
});

/**
 * Optional apiary filter shared by the read tools. Omitting it searches every
 * apiary the user owns or is an active member of, which is what the web app
 * calls "All apiaries"; MCP never relies on the `x-apiary-id` header.
 */
export const apiaryIdArg = z
  .string()
  .uuid()
  .optional()
  .describe(
    'Limit results to one apiary (an id from list_apiaries). Omit to cover all apiaries the user can access.',
  );

export const READ_ONLY = { readOnlyHint: true, openWorldHint: false } as const;
export const WRITE = {
  readOnlyHint: false,
  destructiveHint: false,
  openWorldHint: false,
} as const;

interface ToolConfig<Shape extends z.ZodRawShape> {
  title: string;
  description: string;
  inputSchema?: Shape;
  annotations?: ToolAnnotations;
}

type LooseRegisterTool = (
  name: string,
  config: ToolConfig<z.ZodRawShape>,
  cb: (args: unknown) => Promise<CallToolResult>,
) => void;

/**
 * Tool definitions as published by tools/list, per server. See
 * publishFlatToolList.
 */
const publishedTools = new WeakMap<McpServer, Tool[]>();

/**
 * JSON Schema for a tool's input with every reused schema inlined: the SDK's
 * converter emits $ref for a zod schema used in more than one field (shared
 * date and rating schemas), which some MCP clients and validators mishandle.
 */
// zodToJsonSchema's generic options type is too deep for the compiler here.
const toJsonSchema = zodToJsonSchema as unknown as (
  schema: z.ZodTypeAny,
  options: Record<string, unknown>,
) => object;

const toFlatInputSchema = (shape: z.ZodRawShape = {}): Tool['inputSchema'] => {
  const { $schema: _draft, ...schema } = toJsonSchema(z.object(shape), {
    $refStrategy: 'none',
    strictUnions: true,
    pipeStrategy: 'input',
    dateStrategy: 'format:date-time',
  }) as Tool['inputSchema'] & { $schema?: string };
  return simplifyJsonSchema(schema) as Tool['inputSchema'];
};

/**
 * `server.registerTool` with argument types inferred from a zod 3 shape. The
 * SDK's own generics accept zod 3 and 4 and are too deep for the compiler
 * with shapes as large as the inspection schema (TS2589). The SDK still
 * validates calls against the zod shape; tools/list serves the flat schema.
 */
export function registerTool<Shape extends z.ZodRawShape>(
  server: McpServer,
  name: string,
  config: ToolConfig<Shape>,
  cb: (
    args: z.objectOutputType<Shape, z.ZodTypeAny>,
  ) => Promise<CallToolResult>,
): void {
  (server.registerTool as unknown as LooseRegisterTool).call(
    server,
    name,
    config,
    cb,
  );
  const tools = publishedTools.get(server) ?? [];
  tools.push({
    name,
    title: config.title,
    description: config.description,
    inputSchema: toFlatInputSchema(config.inputSchema),
    annotations: config.annotations,
  });
  publishedTools.set(server, tools);
}

/**
 * Serves tools/list from the flat schemas built by registerTool instead of the
 * SDK's own conversion. Call once all tools are registered.
 */
export function publishFlatToolList(server: McpServer): void {
  const tools = publishedTools.get(server) ?? [];
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));
}
