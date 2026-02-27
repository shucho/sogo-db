/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#tool-create_record
 * @task: TASK-010
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DBRecord } from 'sogo-db-core';
import type { ServerContext } from '../context.js';
import { findDatabase, saveDatabase } from '../context.js';
import { namedFieldsToRecord, recordToNamedFields } from '../fieldResolver.js';

export function registerCreateRecord(server: McpServer, ctx: ServerContext) {
	server.tool(
		'create_record',
		'Create a new record using field names',
		{
			database: z.string().describe('Database ID or name'),
			values: z.record(z.unknown()).describe('Field values by name'),
		},
		async ({ database, values }) => {
			const entry = await findDatabase(ctx, database);
			if (!entry) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: `Database "${database}" not found` }) }] };
			}

			try {
				const resolved = namedFieldsToRecord(values, entry.db.schema);
				const record: DBRecord = {
					id: crypto.randomUUID(),
					...resolved,
				} as DBRecord;

				entry.db.records.push(record);
				await saveDatabase(entry.db, entry.path);

				return {
					content: [{
						type: 'text',
						text: JSON.stringify({
							created: recordToNamedFields(record, entry.db.schema),
						}, null, 2),
					}],
				};
			} catch (err) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: String(err) }) }] };
			}
		},
	);
}
