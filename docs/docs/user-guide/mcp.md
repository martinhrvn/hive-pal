---
title: Connecting AI assistants (MCP)
description: Connect Claude and other MCP clients to Hive-Pal so they can read your hives and inspections and record new entries for you.
keywords: [beekeeping MCP, Claude beekeeping, AI assistant hive records, Model Context Protocol]
---

# Connecting AI assistants (MCP)

Hive-Pal can be connected to AI assistants that support the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP), such as Claude. Once connected, you can ask the assistant about your apiaries in plain language ("which hives haven't been inspected in three weeks?") and have it record inspections, feedings or todos for you.

## Connecting

Use the MCP server URL of your Hive-Pal instance:

```
https://<your-hive-pal-host>/api/mcp
```

- **Claude (web and desktop)**: Settings → Connectors → Add custom connector, and paste the URL.
- **Claude Code**: `claude mcp add --transport http hivepal https://<your-hive-pal-host>/api/mcp`, then run `/mcp` to sign in.

The assistant opens a Hive-Pal sign-in page. After signing in you're asked whether to allow access, with a list of what the assistant will be able to do.

## What the assistant can do

**Read** (always included): apiaries, hives, queens, inspections, actions such as feedings and treatments, due inspections, the calendar, todos, alerts, feed types and apiary weather. It sees every apiary you own or are a member of, the same as the "All apiaries" view.

**Write** (when the assistant asks for write access): record inspections and standalone actions, update queens (for example marking a virgin queen as active once she is laying), add and update todos, and dismiss alerts. Feedings recorded this way get the same calculated amounts and sugar totals as feedings entered in the app. The assistant can't delete anything, and it is told to check with you before it records anything.

Access follows your apiary roles: on an apiary where you're a viewer, the assistant can read but not write.
