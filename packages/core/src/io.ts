/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#file-io-utilities
 * @task: TASK-005
 * @validated: null
 * ---
 */

import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Database } from './types.js';

export function getGlobalDatabasePath(): string {
	return join(homedir(), '.sogo', 'globalDatabases');
}

export async function readDatabaseFile(filePath: string): Promise<Database> {
	const content = await readFile(filePath, 'utf-8');
	const db = JSON.parse(content) as Database;
	db.schema ??= [];
	db.views ??= [];
	db.records ??= [];
	for (const view of db.views) {
		view.sort ??= [];
		view.filter ??= [];
		view.hiddenFields ??= [];
	}
	return db;
}

export async function writeDatabaseFile(db: Database, filePath: string): Promise<void> {
	await writeFile(filePath, JSON.stringify(db, null, '\t'), 'utf-8');
}

export async function scanDirectory(
	dirPath: string,
	depth: number = 3,
): Promise<Array<{ db: Database; path: string }>> {
	const results: Array<{ db: Database; path: string }> = [];
	await scanDirectoryRecursive(dirPath, results, depth);
	return results;
}

async function scanDirectoryRecursive(
	dirPath: string,
	results: Array<{ db: Database; path: string }>,
	depth: number,
): Promise<void> {
	if (depth <= 0) return;
	try {
		const entries = await readdir(dirPath, { withFileTypes: true });
		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name);
			if (!entry.isDirectory() && entry.name.endsWith('.db.json')) {
				try {
					const db = await readDatabaseFile(fullPath);
					results.push({ db, path: fullPath });
				} catch { /* skip malformed */ }
			} else if (entry.isDirectory() && depth > 1 && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
				await scanDirectoryRecursive(fullPath, results, depth - 1);
			}
		}
	} catch { /* skip inaccessible */ }
}

export async function scanAll(
	workspacePath: string,
	globalPath?: string,
	scanDepth: number = 3,
): Promise<Array<{ db: Database; path: string; scope: 'global' | 'workspace' }>> {
	const seenIds = new Set<string>();
	const results: Array<{ db: Database; path: string; scope: 'global' | 'workspace' }> = [];

	const resolvedGlobalPath = globalPath ?? getGlobalDatabasePath();
	const globalResults = await scanDirectory(resolvedGlobalPath, 2);
	for (const entry of globalResults) {
		if (!seenIds.has(entry.db.id)) {
			seenIds.add(entry.db.id);
			results.push({ ...entry, scope: 'global' });
		}
	}

	const workspaceResults = await scanDirectory(workspacePath, scanDepth);
	for (const entry of workspaceResults) {
		if (!seenIds.has(entry.db.id)) {
			seenIds.add(entry.db.id);
			results.push({ ...entry, scope: 'workspace' });
		}
	}

	return results;
}
