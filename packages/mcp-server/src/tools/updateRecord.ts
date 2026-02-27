/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#tool-update_record
 * @task: TASK-010
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { ServerContext } from '../context.js';
import { findDatabase, saveDatabase } from '../context.js';
import { namedFieldsToRecord, recordToNamedFields } from '../fieldResolver.js';

export function registerUpdateRecord(server: McpServer, ctx: ServerContext) {
	server.tool(
		'update_record',
		'Update specific fields of a record by name',
		{
			database: z.string().describe('Database ID or name'),
			recordId: z.string().describe('Record ID'),
			values: z.record(z.unknown()).describe('Field values by name to update'),
		},
		async ({ database, recordId, values }) => {
			const entry = await findDatabase(ctx, database);
			if (!entry) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: `Database "${database}" not found` }) }] };
			}

			const record = entry.db.records.find(r => r.id === recordId);
			if (!record) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: `Record "${recordId}" not found` }) }] };
			}

			try {
				const resolved = namedFieldsToRecord(values, entry.db.schema);
				for (const [key, val] of Object.entries(resolved)) {
					if (key !== 'id') (record as Record<string, unknown>)[key] = val;
				}
				await saveDatabase(entry.db, entry.path);

				return {
					content: [{
						type: 'text',
						text: JSON.stringify({
							updated: recordToNamedFields(record, entry.db.schema),
						}, null, 2),
					}],
				};
			} catch (err) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
			}
		},
	);
}
