/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#tool-get_database_schema
 * @task: TASK-008
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ServerContext } from '../context.js';
import { findDatabase } from '../context.js';

export function registerGetDatabaseSchema(server: McpServer, ctx: ServerContext) {
	server.tool(
		'get_database_schema',
		'Get field definitions and views for a database',
		{ database: z.string().describe('Database ID or name (fuzzy match)') },
		async ({ database }) => {
			const entry = await findDatabase(ctx, database);
			if (!entry) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: `Database "${database}" not found` }) }] };
			}
			const result = {
				id: entry.db.id,
				name: entry.db.name,
				scope: entry.scope,
				fields: entry.db.schema.map(f => ({
					name: f.name,
					type: f.type,
					options: f.options,
					relation: f.relation,
					rollup: f.rollup,
					formula: f.formula,
				})),
				views: entry.db.views.map(v => ({
					name: v.name,
					type: v.type,
					groupBy: v.groupBy ? entry.db.schema.find(f => f.id === v.groupBy)?.name : undefined,
				})),
			};
			return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
		},
	);
}
