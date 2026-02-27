/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#tool-list_records
 * @task: TASK-009
 * @validated: null
 * ---
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { applySorts, applyFilters } from 'sogo-db-core';
import type { ServerContext } from '../context.js';
import { findDatabase } from '../context.js';
import { resolveField, recordToNamedFields } from '../fieldResolver.js';

export function registerListRecords(server: McpServer, ctx: ServerContext) {
	server.tool(
		'list_records',
		'List records with optional filter, sort, and pagination',
		{
			database: z.string().describe('Database ID or name'),
			filter: z.array(z.object({
				field: z.string(),
				op: z.string(),
				value: z.string(),
			})).optional().describe('Filters by field name'),
			sort: z.array(z.object({
				field: z.string(),
				direction: z.enum(['asc', 'desc']),
			})).optional().describe('Sort by field name'),
			page: z.number().int().min(1).optional().default(1),
			pageSize: z.number().int().min(1).max(200).optional().default(50),
		},
		async ({ database, filter, sort, page, pageSize }) => {
			const entry = await findDatabase(ctx, database);
			if (!entry) {
				return { content: [{ type: 'text', text: JSON.stringify({ error: `Database "${database}" not found` }) }] };
			}
			const { db } = entry;
			let records = db.records;

			if (filter?.length) {
				const resolvedFilters = filter.map(f => ({
					fieldId: resolveField(db.schema, f.field).id,
					op: f.op,
					value: f.value,
				}));
				records = applyFilters(records, resolvedFilters, db.schema, db);
			}

			if (sort?.length) {
				const resolvedSorts = sort.map(s => ({
					fieldId: resolveField(db.schema, s.field).id,
					direction: s.direction as 'asc' | 'desc',
				}));
				records = applySorts(records, resolvedSorts, db.schema, db);
			}

			const total = records.length;
			const start = (page - 1) * pageSize;
			const paged = records.slice(start, start + pageSize);
			const namedRecords = paged.map(r => recordToNamedFields(r, db.schema));

			return {
				content: [{
					type: 'text',
					text: JSON.stringify({
						database: db.name,
						total,
						page,
						pageSize,
						records: namedRecords,
					}, null, 2),
				}],
			};
		},
	);
}
