/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#server-setup
 * @task: TASK-008
 * @validated: null
 * ---
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createContext } from './context.js';
import { registerListDatabases } from './tools/listDatabases.js';
import { registerGetDatabaseSchema } from './tools/getDatabaseSchema.js';
import { registerListRecords } from './tools/listRecords.js';
import { registerCreateRecord } from './tools/createRecord.js';
import { registerUpdateRecord } from './tools/updateRecord.js';
import { registerDeleteRecord } from './tools/deleteRecord.js';
import { registerSearchRecords } from './tools/searchRecords.js';
import { registerResources } from './resources.js';

export function createServer() {
	const server = new McpServer({
		name: 'sogo-db',
		version: '0.1.0',
	});

	const ctx = createContext();

	// Register all tools
	registerListDatabases(server, ctx);
	registerGetDatabaseSchema(server, ctx);
	registerListRecords(server, ctx);
	registerCreateRecord(server, ctx);
	registerUpdateRecord(server, ctx);
	registerDeleteRecord(server, ctx);
	registerSearchRecords(server, ctx);

	// Register resources
	registerResources(server, ctx);

	return { server, ctx };
}

async function main() {
	const { server } = createServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch(err => {
	console.error('sogo-mcp-server failed to start:', err);
	process.exit(1);
});
