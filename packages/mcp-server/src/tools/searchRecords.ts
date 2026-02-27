/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#tool-search_records
 * @task: TASK-011
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ServerContext } from '../context.js';
import { findDatabase, loadAllDatabases } from '../context.js';
import { recordToNamedFields } from '../fieldResolver.js';

export function registerSearchRecords(server: McpServer, ctx: ServerContext) {
	server.tool(
		'search_records',
		'Full-text search across databases',
		{
			query: z.string().describe('Search query'),
			database: z.string().optional().describe('Optional: limit to a specific database ID or name'),
		},
		async ({ query, database }) => {
			const lower = query.toLowerCase();
			const entries = database
				? await findDatabase(ctx, database).then(e => e ? [e] : [])
				: await loadAllDatabases(ctx);

			const results: Array<{ database: string; record: Record<string, unknown> }> = [];

			for (const entry of entries) {
				const { db } = entry;
				const searchableFieldIds = db.schema
					.filter(f => ['text', 'select', 'status', 'multiselect', 'email', 'url', 'phone'].includes(f.type))
					.map(f => f.id);

				for (const record of db.records) {
					const matches = searchableFieldIds.some(fid => {
						const val = record[fid];
						if (val === null || val === undefined) return false;
						const str = Array.isArray(val) ? val.join(' ') : String(val);
						return str.toLowerCase().includes(lower);
					});
					if (matches) {
						results.push({
							database: db.name,
							record: recordToNamedFields(record, db.schema),
						});
					}
				}
			}

			return {
				content: [{
					type: 'text',
					text: JSON.stringify({
						query,
						total: results.length,
						results: results.slice(0, 50),
					}, null, 2),
				}],
			};
		},
	);
}
