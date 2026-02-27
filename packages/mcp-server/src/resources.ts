/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#resources
 * @task: TASK-012
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ServerContext } from './context.js';
import { loadAllDatabases, findDatabase } from './context.js';
import { databaseSummary, recordToNamedFields } from './fieldResolver.js';

export function registerResources(server: McpServer, ctx: ServerContext) {
	// sogo://databases — list all databases
	server.resource(
		'databases',
		'sogo://databases',
		{ description: 'List all databases', mimeType: 'application/json' },
		async () => {
			const entries = await loadAllDatabases(ctx);
			const summaries = entries.map(e => databaseSummary(e.db, e.scope));
			return { contents: [{ uri: 'sogo://databases', text: JSON.stringify(summaries, null, 2), mimeType: 'application/json' }] };
		},
	);
}
