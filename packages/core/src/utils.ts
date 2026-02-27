/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#utility-functions
 * @task: TASK-003
 * @validated: null
 * ---
 */

import type { Database, DatabaseResolver, DBRecord, DBView, Field } from './types.js';
import { DEFAULT_OPTION_COLORS, STATUS_GROUPS } from './types.js';
import { computeFormulaValue } from './formula.js';
import { computeRollupValue } from './rollup.js';

export function getFieldValue(
	record: DBRecord,
	field: Field,
	db: Database,
	resolveDatabase?: DatabaseResolver,
): string | number | boolean | string[] | null | undefined {
	if (field.type === 'rollup') {
		return computeRollupValue(record, field, db, resolveDatabase);
	}
	if (field.type === 'formula') {
		return computeFormulaValue(record, field);
	}
	return record[field.id];
}

export function getFieldDisplayValue(
	record: DBRecord,
	fieldId: string,
	schema?: Field[],
	db?: Database,
	resolveDatabase?: DatabaseResolver,
): string {
	const field = schema?.find(f => f.id === fieldId);
	const val = field && db ? getFieldValue(record, field, db, resolveDatabase) : record[fieldId];
	if (val === null || val === undefined) return '';
	if (Array.isArray(val)) return val.join(', ');
	if (typeof val === 'boolean') return val ? '\u2713' : '\u2014';
	return String(val);
}

export function getRecordTitle(record: DBRecord, schema: Field[]): string {
	const titleField = schema.find(f => f.type === 'text');
	if (!titleField) return 'Untitled';
	const val = record[titleField.id];
	return val !== null && val !== undefined && val !== '' ? String(val) : 'Untitled';
}

export function getVisibleFields(schema: Field[], view: DBView): Field[] {
	const order = view.fieldOrder ?? schema.map(f => f.id);
	const hidden = new Set(view.hiddenFields ?? []);
	return order
		.map(id => schema.find(f => f.id === id))
		.filter((f): f is Field => f !== undefined && !hidden.has(f.id));
}

export function getStatusColor(value: string): string {
	return STATUS_GROUPS[value]?.color ?? '#5e5e5e';
}

export function getFieldOptionColor(field: Field, option: string): string {
	const explicit = field.optionColors?.[option];
	if (explicit) return explicit;
	const options = field.options ?? [];
	const index = options.indexOf(option);
	if (index >= 0) return DEFAULT_OPTION_COLORS[index % DEFAULT_OPTION_COLORS.length];
	return DEFAULT_OPTION_COLORS[0];
}

export function getReadableTextColor(background: string): string {
	const hex = background.replace('#', '').trim();
	if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#ffffff';
	const r = parseInt(hex.slice(0, 2), 16);
	const g = parseInt(hex.slice(2, 4), 16);
	const b = parseInt(hex.slice(4, 6), 16);
	const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
	return luminance > 0.62 ? '#1f2937' : '#ffffff';
}
