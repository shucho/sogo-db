import { describe, it, expect } from 'vitest';
import { applySorts, applyFilters } from '../sort-filter.js';
import type { DBRecord, Field, Database } from '../types.js';

const schema: Field[] = [
	{ id: 'f1', name: 'Name', type: 'text' },
	{ id: 'f2', name: 'Count', type: 'number' },
	{ id: 'f3', name: 'Status', type: 'status', options: ['Not started', 'In progress', 'Done'] },
];

const db: Database = { id: 'db1', name: 'Test', schema, views: [], records: [] };

const records: DBRecord[] = [
	{ id: 'r1', f1: 'Charlie', f2: 3, f3: 'Done' },
	{ id: 'r2', f1: 'Alice', f2: 1, f3: 'Not started' },
	{ id: 'r3', f1: 'Bob', f2: 2, f3: 'In progress' },
	{ id: 'r4', f1: null, f2: null, f3: null },
];

describe('applySorts', () => {
	it('sorts ascending by text', () => {
		const sorted = applySorts(records, [{ fieldId: 'f1', direction: 'asc' }], schema, db);
		expect(sorted.map(r => r.f1)).toEqual([null, 'Alice', 'Bob', 'Charlie']);
	});

	it('sorts descending by number', () => {
		const sorted = applySorts(records, [{ fieldId: 'f2', direction: 'desc' }], schema, db);
		expect(sorted.map(r => r.f2)).toEqual([3, 2, 1, null]);
	});

	it('handles multi-field sort', () => {
		const dupes: DBRecord[] = [
			{ id: 'r1', f1: 'A', f2: 2 },
			{ id: 'r2', f1: 'A', f2: 1 },
			{ id: 'r3', f1: 'B', f2: 1 },
		];
		const sorted = applySorts(dupes, [
			{ fieldId: 'f1', direction: 'asc' },
			{ fieldId: 'f2', direction: 'asc' },
		]);
		expect(sorted.map(r => r.id)).toEqual(['r2', 'r1', 'r3']);
	});

	it('returns original when no sorts', () => {
		expect(applySorts(records, [])).toBe(records);
	});
});

describe('applyFilters', () => {
	it('filters by contains', () => {
		const result = applyFilters(records, [{ fieldId: 'f1', op: 'contains', value: 'li' }]);
		expect(result.map(r => r.f1)).toEqual(['Charlie', 'Alice']);
	});

	it('filters by equals', () => {
		const result = applyFilters(records, [{ fieldId: 'f3', op: 'equals', value: 'done' }]);
		expect(result.map(r => r.f1)).toEqual(['Charlie']);
	});

	it('filters by not_equals', () => {
		const result = applyFilters(records, [{ fieldId: 'f3', op: 'not_equals', value: 'done' }]);
		expect(result).toHaveLength(3);
	});

	it('filters by is_empty', () => {
		const result = applyFilters(records, [{ fieldId: 'f1', op: 'is_empty', value: '' }]);
		expect(result).toHaveLength(1);
		expect(result[0].id).toBe('r4');
	});

	it('filters by is_not_empty', () => {
		const result = applyFilters(records, [{ fieldId: 'f1', op: 'is_not_empty', value: '' }]);
		expect(result).toHaveLength(3);
	});

	it('filters by gt', () => {
		const result = applyFilters(records, [{ fieldId: 'f2', op: 'gt', value: '1' }]);
		expect(result.map(r => r.f2)).toEqual([3, 2]);
	});

	it('filters by lte (null coerces to 0, which is <= 2)', () => {
		const result = applyFilters(records, [{ fieldId: 'f2', op: 'lte', value: '2' }]);
		expect(result.map(r => r.f2)).toEqual([1, 2, null]);
	});

	it('filters by not_contains', () => {
		const result = applyFilters(records, [{ fieldId: 'f1', op: 'not_contains', value: 'li' }]);
		expect(result.map(r => r.f1)).toEqual(['Bob', null]);
	});

	it('returns original when no filters', () => {
		expect(applyFilters(records, [])).toBe(records);
	});

	it('handles multiple filters (AND logic)', () => {
		const result = applyFilters(records, [
			{ fieldId: 'f2', op: 'gte', value: '2' },
			{ fieldId: 'f1', op: 'contains', value: 'b' },
		]);
		expect(result.map(r => r.f1)).toEqual(['Bob']);
	});
});
