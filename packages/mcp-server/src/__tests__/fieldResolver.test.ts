import { describe, it, expect } from 'vitest';
import { resolveField, recordToNamedFields, namedFieldsToRecord, databaseSummary } from '../fieldResolver.js';
import type { Database, DBRecord, Field } from 'sogo-db-core';

const schema: Field[] = [
	{ id: 'f1', name: 'Title', type: 'text' },
	{ id: 'f2', name: 'Status', type: 'status', options: ['Not started', 'In progress', 'Done'] },
	{ id: 'f3', name: 'Count', type: 'number' },
];

describe('resolveField', () => {
	it('resolves by exact name (case-insensitive)', () => {
		expect(resolveField(schema, 'title').id).toBe('f1');
		expect(resolveField(schema, 'STATUS').id).toBe('f2');
	});

	it('throws on unknown field', () => {
		expect(() => resolveField(schema, 'nonexistent')).toThrow('not found');
	});
});

describe('recordToNamedFields', () => {
	it('converts field IDs to names', () => {
		const record: DBRecord = { id: 'r1', f1: 'Hello', f2: 'Done', f3: 42 };
		const named = recordToNamedFields(record, schema);
		expect(named).toEqual({
			id: 'r1',
			Title: 'Hello',
			Status: 'Done',
			Count: 42,
		});
	});

	it('preserves _body', () => {
		const record: DBRecord = { id: 'r1', f1: 'Test', _body: 'Notes here' };
		const named = recordToNamedFields(record, schema);
		expect(named._body).toBe('Notes here');
	});
});

describe('namedFieldsToRecord', () => {
	it('converts field names to IDs', () => {
		const values = { Title: 'Hello', Count: 42 };
		const record = namedFieldsToRecord(values, schema);
		expect(record).toEqual({ f1: 'Hello', f3: 42 });
	});

	it('passes through id and _body', () => {
		const values = { id: 'r1', _body: 'notes', Title: 'Test' };
		const record = namedFieldsToRecord(values, schema);
		expect(record.id).toBe('r1');
		expect(record._body).toBe('notes');
	});
});

describe('databaseSummary', () => {
	it('returns summary object', () => {
		const db: Database = {
			id: 'db1', name: 'Test', schema,
			views: [{ id: 'v1', name: 'All', type: 'table', sort: [], filter: [], hiddenFields: [] }],
			records: [{ id: 'r1', f1: 'A' }, { id: 'r2', f1: 'B' }],
		};
		const summary = databaseSummary(db, 'global');
		expect(summary.name).toBe('Test');
		expect(summary.scope).toBe('global');
		expect(summary.recordCount).toBe(2);
		expect(summary.fields).toHaveLength(3);
		expect(summary.views).toHaveLength(1);
	});
});
