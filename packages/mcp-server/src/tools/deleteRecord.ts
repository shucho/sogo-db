/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#tool-delete_record
 * @task: TASK-010
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ServerContext } from '../context.js';
import { findDatabase, saveDatabase } from '../context.js';

export function registerDeleteRecord(server: McpServer, ctx: ServerContext) {
	server.tool(
		'delete_record',
		'Delete a record from a database',
		{
			database: z.string().describe('Database ID or name'),
			recordId: z.string().describe('Record ID to delete'),
		},
		async ({ database, recordId }) => {
			const entry = await findDatabase(ctx, database);
			if (!entry) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: `Database "${database}" not found` }) }] };
			}

			const index = entry.db.records.findIndex(r => r.id === recordId);
			if (index === -1) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: `Record "${recordId}" not found` }) }] };
			}

			entry.db.records.splice(index, 1);
			await saveDatabase(entry.db, entry.path);

			return {
				content: [{
					type: 'text',
					text: JSON.stringify({ deleted: recordId, database: entry.db.name }),
				}],
			};
		},
	);
}
