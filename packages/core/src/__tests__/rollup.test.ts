import { describe, it, expect } from 'vitest';
import { computeRollupValue } from '../rollup.js';
import type { Database, DBRecord, Field } from '../types.js';

const targetDb: Database = {
	id: 'target-db',
	name: 'Items',
	schema: [
		{ id: 'tf1', name: 'Name', type: 'text' },
		{ id: 'tf2', name: 'Value', type: 'number' },
		{ id: 'tf3', name: 'Tag', type: 'text' },
	],
	views: [],
	records: [
		{ id: 'tr1', tf1: 'Item A', tf2: 10, tf3: 'active' },
		{ id: 'tr2', tf1: 'Item B', tf2: 20, tf3: '' },
		{ id: 'tr3', tf1: 'Item C', tf2: 30, tf3: 'active' },
	],
};

const relationField: Field = {
	id: 'rf1', name: 'Items', type: 'relation',
	relation: { targetDatabaseId: 'target-db' },
};

const sourceDb: Database = {
	id: 'source-db',
	name: 'Source',
	schema: [
		{ id: 'sf1', name: 'Name', type: 'text' },
		relationField,
	],
	views: [],
	records: [],
};

const resolver = (id: string) => id === 'target-db' ? targetDb : undefined;

function makeRollupField(aggregation: string, targetFieldId?: string): Field {
	return {
		id: 'rollup1', name: 'Rollup', type: 'rollup',
		rollup: {
			relationFieldId: 'rf1',
			targetFieldId,
			aggregation: aggregation as any,
		},
	};
}

describe('computeRollupValue', () => {
	it('counts linked records', () => {
		const record: DBRecord = { id: 'r1', rf1: ['tr1', 'tr2'] };
		expect(computeRollupValue(record, makeRollupField('count'), sourceDb, resolver)).toBe(2);
	});

	it('returns 0 count for empty links', () => {
		const record: DBRecord = { id: 'r1', rf1: [] };
		expect(computeRollupValue(record, makeRollupField('count'), sourceDb, resolver)).toBe(0);
	});

	it('counts non-empty values', () => {
		const record: DBRecord = { id: 'r1', rf1: ['tr1', 'tr2', 'tr3'] };
		expect(computeRollupValue(record, makeRollupField('count_not_empty', 'tf3'), sourceDb, resolver)).toBe(2);
	});

	it('sums numeric values', () => {
		const record: DBRecord = { id: 'r1', rf1: ['tr1', 'tr2', 'tr3'] };
		expect(computeRollupValue(record, makeRollupField('sum', 'tf2'), sourceDb, resolver)).toBe(60);
	});

	it('averages numeric values', () => {
		const record: DBRecord = { id: 'r1', rf1: ['tr1', 'tr2', 'tr3'] };
		expect(computeRollupValue(record, makeRollupField('avg', 'tf2'), sourceDb, resolver)).toBe(20);
	});

	it('finds min', () => {
		const record: DBRecord = { id: 'r1', rf1: ['tr1', 'tr2', 'tr3'] };
		expect(computeRollupValue(record, makeRollupField('min', 'tf2'), sourceDb, resolver)).toBe(10);
	});

	it('finds max', () => {
		const record: DBRecord = { id: 'r1', rf1: ['tr1', 'tr2', 'tr3'] };
		expect(computeRollupValue(record, makeRollupField('max', 'tf2'), sourceDb, resolver)).toBe(30);
	});

	it('returns null when no rollup config', () => {
		const field: Field = { id: 'r1', name: 'Bad', type: 'rollup' };
		const record: DBRecord = { id: 'r1' };
		expect(computeRollupValue(record, field, sourceDb, resolver)).toBeNull();
	});

	it('returns null for no links on non-count aggregation', () => {
		const record: DBRecord = { id: 'r1', rf1: [] };
		expect(computeRollupValue(record, makeRollupField('sum', 'tf2'), sourceDb, resolver)).toBeNull();
	});
});
