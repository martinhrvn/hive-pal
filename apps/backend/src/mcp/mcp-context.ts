import type {
  CallToolResult,
  ToolAnnotations,
} from '@modelcontextprotocol/sdk/types.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { MCP_WRITE_SCOPE } from '../auth/mcp-config';

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
 * `server.registerTool` with argument types inferred from a zod 3 shape. The
 * SDK's own generics accept zod 3 and 4 and are too deep for the compiler
 * with shapes as large as the inspection schema (TS2589).
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
}
