import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import type { Database } from 'sogo-db-core';
import { readDatabaseFile } from 'sogo-db-core';
import { createContext, loadAllDatabases, findDatabase, saveDatabase } from '../context.js';
import { recordToNamedFields, namedFieldsToRecord, resolveField } from '../fieldResolver.js';

let testDir: string;
let testDbPath: string;

const testDb: Database = {
	id: 'test-db-1',
	name: 'Test Projects',
	schema: [
		{ id: 'f1', name: 'Name', type: 'text' },
		{ id: 'f2', name: 'Status', type: 'status', options: ['Not started', 'In progress', 'Done'] },
		{ id: 'f3', name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
		{ id: 'f4', name: 'Value', type: 'number' },
	],
	views: [
		{ id: 'v1', name: 'All', type: 'table', sort: [], filter: [], hiddenFields: [] },
	],
	records: [
		{ id: 'r1', f1: 'Project Alpha', f2: 'In progress', f3: 'High', f4: 100 },
		{ id: 'r2', f1: 'Project Beta', f2: 'Not started', f3: 'Low', f4: 50 },
		{ id: 'r3', f1: 'Project Gamma', f2: 'Done', f3: 'Medium', f4: 200 },
	],
};

beforeEach(async () => {
	testDir = join(tmpdir(), `sogo-test-${crypto.randomUUID()}`);
	await mkdir(testDir, { recursive: true });
	testDbPath = join(testDir, 'projects.db.json');
	await writeFile(testDbPath, JSON.stringify(testDb, null, '\t'));
});

afterEach(async () => {
	await rm(testDir, { recursive: true, force: true });
});

describe('context', () => {
	it('scans workspace for databases', async () => {
		const ctx = { globalPath: join(testDir, 'nonexistent'), workspacePath: testDir, scanDepth: 3 };
		const entries = await loadAllDatabases(ctx);
		expect(entries).toHaveLength(1);
		expect(entries[0].db.name).toBe('Test Projects');
		expect(entries[0].scope).toBe('workspace');
	});

	it('finds database by ID', async () => {
		const ctx = { globalPath: join(testDir, 'nonexistent'), workspacePath: testDir, scanDepth: 3 };
		const entry = await findDatabase(ctx, 'test-db-1');
		expect(entry).toBeDefined();
		expect(entry!.db.name).toBe('Test Projects');
	});

	it('finds database by name (case-insensitive)', async () => {
		const ctx = { globalPath: join(testDir, 'nonexistent'), workspacePath: testDir, scanDepth: 3 };
		const entry = await findDatabase(ctx, 'test projects');
		expect(entry).toBeDefined();
		expect(entry!.db.id).toBe('test-db-1');
	});

	it('finds database by partial name', async () => {
		const ctx = { globalPath: join(testDir, 'nonexistent'), workspacePath: testDir, scanDepth: 3 };
		const entry = await findDatabase(ctx, 'project');
		expect(entry).toBeDefined();
	});
});

describe('CRUD operations', () => {
	it('creates a record with field names', async () => {
		const db = await readDatabaseFile(testDbPath);
		const resolved = namedFieldsToRecord({ Name: 'New Project', Status: 'Not started', Value: 75 }, db.schema);
		const record = { id: crypto.randomUUID(), ...resolved };
		db.records.push(record as any);
		await saveDatabase(db, testDbPath);

		const reloaded = await readDatabaseFile(testDbPath);
		expect(reloaded.records).toHaveLength(4);
		const named = recordToNamedFields(reloaded.records[3], reloaded.schema);
		expect(named.Name).toBe('New Project');
		expect(named.Value).toBe(75);
	});

	it('updates a record with field names', async () => {
		const db = await readDatabaseFile(testDbPath);
		const record = db.records.find(r => r.id === 'r1')!;
		const updates = namedFieldsToRecord({ Status: 'Done', Value: 150 }, db.schema);
		for (const [k, v] of Object.entries(updates)) {
			(record as Record<string, unknown>)[k] = v;
		}
		await saveDatabase(db, testDbPath);

		const reloaded = await readDatabaseFile(testDbPath);
		const updated = reloaded.records.find(r => r.id === 'r1')!;
		expect(updated.f2).toBe('Done');
		expect(updated.f4).toBe(150);
	});

	it('deletes a record', async () => {
		const db = await readDatabaseFile(testDbPath);
		db.records = db.records.filter(r => r.id !== 'r2');
		await saveDatabase(db, testDbPath);

		const reloaded = await readDatabaseFile(testDbPath);
		expect(reloaded.records).toHaveLength(2);
		expect(reloaded.records.find(r => r.id === 'r2')).toBeUndefined();
	});
});

describe('search', () => {
	it('finds records by text match', async () => {
		const db = await readDatabaseFile(testDbPath);
		const query = 'alpha';
		const lower = query.toLowerCase();
		const searchableIds = db.schema
			.filter(f => ['text', 'select', 'status'].includes(f.type))
			.map(f => f.id);

		const matches = db.records.filter(record =>
			searchableIds.some(fid => {
				const val = record[fid];
				if (val === null || val === undefined) return false;
				return String(val).toLowerCase().includes(lower);
			}),
		);

		expect(matches).toHaveLength(1);
		expect(matches[0].f1).toBe('Project Alpha');
	});
});

describe('list_records features', () => {
	it('filters by field name', async () => {
		const db = await readDatabaseFile(testDbPath);
		const field = resolveField(db.schema, 'Status');
		const filter = [{ fieldId: field.id, op: 'equals', value: 'in progress' }];
		const { applyFilters } = await import('sogo-db-core');
		const filtered = applyFilters(db.records, filter);
		expect(filtered).toHaveLength(1);
		expect(filtered[0].f1).toBe('Project Alpha');
	});

	it('sorts by field name', async () => {
		const db = await readDatabaseFile(testDbPath);
		const field = resolveField(db.schema, 'Value');
		const sorts = [{ fieldId: field.id, direction: 'desc' as const }];
		const { applySorts } = await import('sogo-db-core');
		const sorted = applySorts(db.records, sorts);
		expect(sorted.map(r => r.f4)).toEqual([200, 100, 50]);
	});

	it('paginates records', async () => {
		const db = await readDatabaseFile(testDbPath);
		const page1 = db.records.slice(0, 2);
		const page2 = db.records.slice(2, 4);
		expect(page1).toHaveLength(2);
		expect(page2).toHaveLength(1);
	});

	it('returns records with field names', async () => {
		const db = await readDatabaseFile(testDbPath);
		const named = db.records.map(r => recordToNamedFields(r, db.schema));
		expect(named[0]).toHaveProperty('Name');
		expect(named[0]).toHaveProperty('Status');
		expect(named[0]).not.toHaveProperty('f1');
	});
});
