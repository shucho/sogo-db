import { describe, it, expect } from 'vitest';
import { exportCsv, importCsvRecords } from '../csv.js';
import type { Database } from '../types.js';

const db: Database = {
	id: 'db1', name: 'Test',
	schema: [
		{ id: 'f1', name: 'Name', type: 'text' },
		{ id: 'f2', name: 'Count', type: 'number' },
		{ id: 'f3', name: 'Tags', type: 'multiselect' },
	],
	views: [],
	records: [
		{ id: 'r1', f1: 'Alice', f2: 10, f3: ['a', 'b'] },
		{ id: 'r2', f1: 'Bob, Jr.', f2: 20, f3: [] },
	],
};

describe('exportCsv', () => {
	it('produces valid CSV with header', () => {
		const csv = exportCsv(db);
		const lines = csv.split('\r\n');
		expect(lines[0]).toBe('id,Name,Count,Tags');
		expect(lines).toHaveLength(3);
	});

	it('escapes commas in values', () => {
		const csv = exportCsv(db);
		const lines = csv.split('\r\n');
		expect(lines[2]).toContain('"Bob, Jr."');
	});

	it('joins multiselect with semicolons', () => {
		const csv = exportCsv(db);
		const lines = csv.split('\r\n');
		expect(lines[1]).toContain('a;b');
	});
});

describe('importCsvRecords', () => {
	it('imports records with field mapping', () => {
		const csvText = 'Name,Count\nCharlie,30\nDave,40';
		const fieldMap = { Name: 'f1', Count: 'f2' };
		const records = importCsvRecords(db, csvText, fieldMap);
		expect(records).toHaveLength(2);
		expect(records[0].f1).toBe('Charlie');
		expect(records[0].f2).toBe(30);
		expect(records[1].f1).toBe('Dave');
		expect(records[1].f2).toBe(40);
	});

	it('generates UUIDs for records', () => {
		const csvText = 'Name\nTest';
		const records = importCsvRecords(db, csvText, { Name: 'f1' });
		expect(records[0].id).toMatch(/^[0-9a-f-]{36}$/);
	});

	it('coerces checkbox values', () => {
		const checkDb: Database = {
			id: 'db1', name: 'Test',
			schema: [{ id: 'f1', name: 'Active', type: 'checkbox' }],
			views: [], records: [],
		};
		const csvText = 'Active\ntrue\nfalse\n1';
		const records = importCsvRecords(checkDb, csvText, { Active: 'f1' });
		expect(records[0].f1).toBe(true);
		expect(records[1].f1).toBe(false);
		expect(records[2].f1).toBe(true);
	});

	it('returns empty for insufficient lines', () => {
		expect(importCsvRecords(db, 'header only', {})).toEqual([]);
	});
});
