import { describe, it, expect } from 'vitest';
import {
	getRecordTitle,
	getFieldDisplayValue,
	getFieldValue,
	getVisibleFields,
	getStatusColor,
	getFieldOptionColor,
	getReadableTextColor,
} from '../utils.js';
import type { Database, DBRecord, DBView, Field } from '../types.js';

const textField: Field = { id: 'f1', name: 'Title', type: 'text' };
const numField: Field = { id: 'f2', name: 'Count', type: 'number' };
const statusField: Field = { id: 'f3', name: 'Status', type: 'status', options: ['Not started', 'In progress', 'Done'] };
const checkField: Field = { id: 'f4', name: 'Active', type: 'checkbox' };
const selectField: Field = { id: 'f5', name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] };

const schema: Field[] = [textField, numField, statusField, checkField, selectField];

const db: Database = {
	id: 'db1',
	name: 'Test',
	schema,
	views: [],
	records: [],
};

describe('getRecordTitle', () => {
	it('returns first text field value', () => {
		const record: DBRecord = { id: 'r1', f1: 'Hello' };
		expect(getRecordTitle(record, schema)).toBe('Hello');
	});

	it('returns Untitled when no text field', () => {
		const record: DBRecord = { id: 'r1' };
		expect(getRecordTitle(record, [numField])).toBe('Untitled');
	});

	it('returns Untitled when text field is empty', () => {
		const record: DBRecord = { id: 'r1', f1: '' };
		expect(getRecordTitle(record, schema)).toBe('Untitled');
	});

	it('returns Untitled when text field is null', () => {
		const record: DBRecord = { id: 'r1', f1: null };
		expect(getRecordTitle(record, schema)).toBe('Untitled');
	});
});

describe('getFieldDisplayValue', () => {
	it('returns string for text', () => {
		const record: DBRecord = { id: 'r1', f1: 'Hello' };
		expect(getFieldDisplayValue(record, 'f1', schema, db)).toBe('Hello');
	});

	it('returns empty string for null', () => {
		const record: DBRecord = { id: 'r1', f1: null };
		expect(getFieldDisplayValue(record, 'f1', schema, db)).toBe('');
	});

	it('joins array values', () => {
		const record: DBRecord = { id: 'r1', f1: ['a', 'b', 'c'] as unknown as string };
		expect(getFieldDisplayValue(record, 'f1')).toBe('a, b, c');
	});

	it('shows check mark for true boolean', () => {
		const record: DBRecord = { id: 'r1', f4: true };
		expect(getFieldDisplayValue(record, 'f4', schema, db)).toBe('\u2713');
	});

	it('shows dash for false boolean', () => {
		const record: DBRecord = { id: 'r1', f4: false };
		expect(getFieldDisplayValue(record, 'f4', schema, db)).toBe('\u2014');
	});
});

describe('getFieldValue', () => {
	it('returns raw value for basic fields', () => {
		const record: DBRecord = { id: 'r1', f1: 'Hello', f2: 42 };
		expect(getFieldValue(record, textField, db)).toBe('Hello');
		expect(getFieldValue(record, numField, db)).toBe(42);
	});
});

describe('getVisibleFields', () => {
	it('returns all fields when no hidden fields', () => {
		const view: DBView = { id: 'v1', name: 'Test', type: 'table', sort: [], filter: [], hiddenFields: [] };
		expect(getVisibleFields(schema, view)).toEqual(schema);
	});

	it('hides fields in hiddenFields', () => {
		const view: DBView = { id: 'v1', name: 'Test', type: 'table', sort: [], filter: [], hiddenFields: ['f2', 'f4'] };
		const visible = getVisibleFields(schema, view);
		expect(visible.map(f => f.id)).toEqual(['f1', 'f3', 'f5']);
	});

	it('respects fieldOrder', () => {
		const view: DBView = { id: 'v1', name: 'Test', type: 'table', sort: [], filter: [], hiddenFields: [], fieldOrder: ['f3', 'f1', 'f2'] };
		const visible = getVisibleFields(schema, view);
		expect(visible.map(f => f.id)).toEqual(['f3', 'f1', 'f2']);
	});
});

describe('getStatusColor', () => {
	it('returns color for known status', () => {
		expect(getStatusColor('In progress')).toBe('#2e75d0');
		expect(getStatusColor('Done')).toBe('#2d9e6b');
	});

	it('returns default for unknown status', () => {
		expect(getStatusColor('Unknown')).toBe('#5e5e5e');
	});
});

describe('getFieldOptionColor', () => {
	it('returns explicit color', () => {
		const field: Field = { id: 'f1', name: 'T', type: 'select', options: ['A'], optionColors: { A: '#ff0000' } };
		expect(getFieldOptionColor(field, 'A')).toBe('#ff0000');
	});

	it('returns default color by index', () => {
		const color = getFieldOptionColor(selectField, 'Medium');
		expect(color).toBe('#8b6b4a'); // index 1
	});
});

describe('getReadableTextColor', () => {
	it('returns dark text for light backgrounds', () => {
		expect(getReadableTextColor('#ffffff')).toBe('#1f2937');
	});

	it('returns white text for dark backgrounds', () => {
		expect(getReadableTextColor('#000000')).toBe('#ffffff');
	});
});
