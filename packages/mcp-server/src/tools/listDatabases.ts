/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#tool-list_databases
 * @task: TASK-008
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ServerContext } from '../context.js';
import { loadAllDatabases } from '../context.js';
import { databaseSummary } from '../fieldResolver.js';

export function registerListDatabases(server: McpServer, ctx: ServerContext) {
	server.tool('list_databases', 'List all databases (global + workspace) with schemas', {}, async () => {
		const entries = await loadAllDatabases(ctx);
		const results = entries.map(e => databaseSummary(e.db, e.scope));
		return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
	});
}
