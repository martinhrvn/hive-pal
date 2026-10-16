import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { NotFoundException } from '@nestjs/common';
import { McpServerFactory } from './mcp-server.factory';
import { McpContext } from './mcp-context';
import { MCP_READ_SCOPE, MCP_WRITE_SCOPE } from '../auth/mcp-config';

const HIVE_ID = '6f1c7a52-1d4b-4c1e-9a4f-0c8f3b7f2a10';
const APIARY_ID = '0b5e6a3c-8f2d-4d7e-b1a9-2c4d6e8f0a1b';

const makeDeps = () => ({
  scope: {
    resolve: vi.fn((userId: string, apiaryId?: string) =>
      Promise.resolve(
        apiaryId ? { userId, apiaryId } : { userId, allApiaries: true },
      ),
    ),
  },
  apiaries: { findAll: vi.fn() },
  hives: {
    findAll: vi.fn().mockResolvedValue([{ id: HIVE_ID, name: 'Hive 1' }]),
    findOne: vi.fn(),
  },
  queens: { findAll: vi.fn() },
  inspections: { findAll: vi.fn(), create: vi.fn() },
  actions: { findAll: vi.fn(), createStandaloneAction: vi.fn() },
  calendar: { getCalendarEvents: vi.fn() },
  todos: {
    findAll: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 'todo-1' }),
  },
  alerts: { findAll: vi.fn(), dismiss: vi.fn() },
  weather: { assertApiaryReadable: vi.fn() },
  feedTypes: { getFeedTypes: vi.fn().mockResolvedValue([]) },
});

async function connect(scopes: string[]) {
  const deps = makeDeps();
  const factory = new (
    McpServerFactory as unknown as new (...args: unknown[]) => McpServerFactory
  )(
    deps.scope,
    deps.apiaries,
    deps.hives,
    deps.queens,
    deps.inspections,
    deps.actions,
    deps.calendar,
    deps.todos,
    deps.alerts,
    deps.weather,
    deps.feedTypes,
  );
  const ctx: McpContext = { userId: 'user-1', scopes: new Set(scopes) };
  const server = factory.create(ctx);
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test', version: '1.0.0' });
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ]);
  return { client, deps };
}

describe('McpServerFactory', () => {
  it('only offers read tools without the write scope', async () => {
    const { client } = await connect([MCP_READ_SCOPE]);
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    expect(names).toContain('list_hives');
    expect(names).not.toContain('create_todo');
    expect(tools.every((t) => t.annotations?.readOnlyHint)).toBe(true);
  });

  it('adds write tools with the write scope', async () => {
    const { client } = await connect([MCP_READ_SCOPE, MCP_WRITE_SCOPE]);
    const names = (await client.listTools()).tools.map((t) => t.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'create_inspection',
        'record_action',
        'create_todo',
        'update_todo',
        'dismiss_alert',
        'update_queen',
      ]),
    );
  });

  it('scopes reads to all apiaries unless an apiary is given', async () => {
    const { client, deps } = await connect([MCP_READ_SCOPE]);
    const result = await client.callTool({ name: 'list_hives', arguments: {} });
    expect(deps.hives.findAll).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'user-1', allApiaries: true }),
    );
    expect(JSON.parse((result.content as { text: string }[])[0].text)).toEqual([
      { id: HIVE_ID, name: 'Hive 1' },
    ]);

    await client.callTool({
      name: 'list_hives',
      arguments: { apiaryId: APIARY_ID },
    });
    expect(deps.scope.resolve).toHaveBeenLastCalledWith('user-1', APIARY_ID);
    expect(deps.hives.findAll).toHaveBeenLastCalledWith(
      expect.objectContaining({ userId: 'user-1', apiaryId: APIARY_ID }),
    );
  });

  it('passes the tool apiary through when creating a todo', async () => {
    const { client, deps } = await connect([MCP_READ_SCOPE, MCP_WRITE_SCOPE]);
    await client.callTool({
      name: 'create_todo',
      arguments: { title: 'Add a super', apiaryId: APIARY_ID },
    });
    expect(deps.todos.create).toHaveBeenCalledWith(
      { title: 'Add a super' },
      { userId: 'user-1', apiaryId: APIARY_ID },
    );
  });

  it('reports service errors as tool errors', async () => {
    const { client, deps } = await connect([MCP_READ_SCOPE]);
    deps.hives.findOne.mockRejectedValue(
      new NotFoundException(`Hive with ID ${HIVE_ID} not found`),
    );
    const result = await client.callTool({
      name: 'get_hive',
      arguments: { hiveId: HIVE_ID },
    });
    expect(result.isError).toBe(true);
    expect((result.content as { text: string }[])[0].text).toContain(
      'not found',
    );
  });
});
