/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#server-setup
 * @task: TASK-008
 * @validated: null
 * ---
 */

import { homedir } from 'node:os';
import { scanAll, readDatabaseFile, writeDatabaseFile, getGlobalDatabasePath } from 'sogo-db-core';
import type { Database } from 'sogo-db-core';

export interface ServerContext {
	globalPath: string;
	workspacePath: string;
	scanDepth: number;
}

function expandTilde(p: string): string {
	return p.startsWith('~') ? p.replace('~', homedir()) : p;
}

export function createContext(): ServerContext {
	const raw = process.env.SOGO_GLOBAL_PATH;
	return {
		globalPath: raw ? expandTilde(raw) : getGlobalDatabasePath(),
		workspacePath: expandTilde(process.env.SOGO_WORKSPACE_PATH ?? process.cwd()),
		scanDepth: parseInt(process.env.SOGO_SCAN_DEPTH ?? '3', 10),
	};
}

export interface DatabaseEntry {
	db: Database;
	path: string;
	scope: 'global' | 'workspace';
}

export async function loadAllDatabases(ctx: ServerContext): Promise<DatabaseEntry[]> {
	return scanAll(ctx.workspacePath, ctx.globalPath, ctx.scanDepth);
}

export async function findDatabase(
	ctx: ServerContext,
	idOrName: string,
): Promise<DatabaseEntry | undefined> {
	const all = await loadAllDatabases(ctx);
	// Try exact ID match first
	const byId = all.find(e => e.db.id === idOrName);
	if (byId) return byId;
	// Then case-insensitive name match
	const lower = idOrName.toLowerCase();
	return all.find(e => e.db.name.toLowerCase() === lower)
		?? all.find(e => e.db.name.toLowerCase().includes(lower));
}

export async function reloadDatabase(entry: DatabaseEntry): Promise<Database> {
	return readDatabaseFile(entry.path);
}

export async function saveDatabase(db: Database, path: string): Promise<void> {
	await writeDatabaseFile(db, path);
}
