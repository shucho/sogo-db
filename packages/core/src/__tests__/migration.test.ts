import { describe, it, expect } from 'vitest';
import { migrateSchema, coerceValueForField } from '../migration.js';
import type { Database, Field } from '../types.js';

describe('migrateSchema', () => {
	it('removes deleted fields from records', () => {
		const db: Database = {
			id: 'db1', name: 'Test',
			schema: [
				{ id: 'f1', name: 'A', type: 'text' },
				{ id: 'f2', name: 'B', type: 'number' },
			],
			views: [{ id: 'v1', name: 'All', type: 'table', sort: [], filter: [], hiddenFields: [] }],
			records: [{ id: 'r1', f1: 'Hello', f2: 42 }],
		};
		const newSchema: Field[] = [{ id: 'f1', name: 'A', type: 'text' }];
		migrateSchema(db, newSchema);
		expect(db.records[0].f2).toBeUndefined();
		expect(db.records[0].f1).toBe('Hello');
	});

	it('coerces values on type change', () => {
		const db: Database = {
			id: 'db1', name: 'Test',
			schema: [{ id: 'f1', name: 'A', type: 'text' }],
			views: [{ id: 'v1', name: 'All', type: 'table', sort: [], filter: [], hiddenFields: [] }],
			records: [{ id: 'r1', f1: '42' }],
		};
		const newSchema: Field[] = [{ id: 'f1', name: 'A', type: 'number' }];
		migrateSchema(db, newSchema);
		expect(db.records[0].f1).toBe(42);
	});

	it('cleans up views on schema change', () => {
		const db: Database = {
			id: 'db1', name: 'Test',
			schema: [
				{ id: 'f1', name: 'A', type: 'text' },
				{ id: 'f2', name: 'B', type: 'status', options: ['Not started'] },
			],
			views: [{
				id: 'v1', name: 'K', type: 'kanban', groupBy: 'f2',
				sort: [{ fieldId: 'f2', direction: 'asc' }],
				filter: [{ fieldId: 'f2', op: 'equals', value: 'x' }],
				hiddenFields: ['f2'],
			}],
			records: [],
		};
		const newSchema: Field[] = [{ id: 'f1', name: 'A', type: 'text' }];
		migrateSchema(db, newSchema);
		expect(db.views[0].sort).toEqual([]);
		expect(db.views[0].filter).toEqual([]);
		expect(db.views[0].hiddenFields).toEqual([]);
		expect(db.views[0].groupBy).toBeUndefined(); // no status/select in new schema
	});

	it('updates fieldOrder', () => {
		const db: Database = {
			id: 'db1', name: 'Test',
			schema: [
				{ id: 'f1', name: 'A', type: 'text' },
				{ id: 'f2', name: 'B', type: 'number' },
			],
			views: [{
				id: 'v1', name: 'All', type: 'table',
				sort: [], filter: [], hiddenFields: [],
				fieldOrder: ['f2', 'f1'],
			}],
			records: [],
		};
		const newSchema: Field[] = [
			{ id: 'f1', name: 'A', type: 'text' },
			{ id: 'f3', name: 'C', type: 'date' },
		];
		migrateSchema(db, newSchema);
		expect(db.views[0].fieldOrder).toEqual(['f1', 'f3']); // f2 removed, f3 appended
	});
});

describe('coerceValueForField', () => {
	it('coerces to number', () => {
		expect(coerceValueForField({ id: 'f', name: 'N', type: 'number' }, '42')).toBe(42);
		expect(coerceValueForField({ id: 'f', name: 'N', type: 'number' }, 'abc')).toBeNull();
	});

	it('coerces to checkbox', () => {
		expect(coerceValueForField({ id: 'f', name: 'C', type: 'checkbox' }, 'true')).toBe(true);
		expect(coerceValueForField({ id: 'f', name: 'C', type: 'checkbox' }, '0')).toBe(false);
		expect(coerceValueForField({ id: 'f', name: 'C', type: 'checkbox' }, 1)).toBe(true);
	});

	it('coerces to multiselect', () => {
		expect(coerceValueForField({ id: 'f', name: 'M', type: 'multiselect' }, 'a;b;c')).toEqual(['a', 'b', 'c']);
		expect(coerceValueForField({ id: 'f', name: 'M', type: 'multiselect' }, null)).toEqual([]);
	});

	it('coerces to select with validation', () => {
		const field: Field = { id: 'f', name: 'S', type: 'select', options: ['A', 'B'] };
		expect(coerceValueForField(field, 'A')).toBe('A');
		expect(coerceValueForField(field, 'C')).toBeNull();
	});

	it('returns null for rollup/formula', () => {
		expect(coerceValueForField({ id: 'f', name: 'R', type: 'rollup' }, 'anything')).toBeNull();
		expect(coerceValueForField({ id: 'f', name: 'F', type: 'formula' }, 'anything')).toBeNull();
	});

	it('returns ISO string for createdAt when null', () => {
		const result = coerceValueForField({ id: 'f', name: 'C', type: 'createdAt' }, null);
		expect(typeof result).toBe('string');
		expect((result as string)).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});
});
