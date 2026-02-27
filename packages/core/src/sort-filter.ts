/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#sort--filter-engine
 * @task: TASK-004
 * @validated: null
 * ---
 */

import type { Database, DatabaseResolver, DBRecord, DBView, Field } from './types.js';
import { getFieldValue } from './utils.js';

export function applySorts(
	records: DBRecord[],
	sorts: DBView['sort'],
	schema?: Field[],
	db?: Database,
	resolveDatabase?: DatabaseResolver,
): DBRecord[] {
	if (!sorts.length) return records;
	return [...records].sort((a, b) => {
		for (const s of sorts) {
			const field = schema?.find(f => f.id === s.fieldId);
			const av = field && db ? getFieldValue(a, field, db, resolveDatabase) : (a[s.fieldId] ?? '');
			const bv = field && db ? getFieldValue(b, field, db, resolveDatabase) : (b[s.fieldId] ?? '');
			const cmp = compareValues(av, bv);
			if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
		}
		return 0;
	});
}

export function applyFilters(
	records: DBRecord[],
	filters: DBView['filter'],
	schema?: Field[],
	db?: Database,
	resolveDatabase?: DatabaseResolver,
): DBRecord[] {
	if (!filters.length) return records;
	return records.filter(record =>
		filters.every(f => {
			const field = schema?.find(candidate => candidate.id === f.fieldId);
			const val = field && db ? getFieldValue(record, field, db, resolveDatabase) : record[f.fieldId];
			const strVal = valueAsFilterString(val);
			const filterVal = f.value.toLowerCase();
			switch (f.op) {
				case 'contains': return strVal.includes(filterVal);
				case 'not_contains': return !strVal.includes(filterVal);
				case 'equals': return strVal === filterVal;
				case 'not_equals': return strVal !== filterVal;
				case 'is_empty': return val === null || val === undefined || val === '' || (Array.isArray(val) && val.length === 0);
				case 'is_not_empty': return val !== null && val !== undefined && val !== '' && !(Array.isArray(val) && val.length === 0);
				case 'gt': return Number(val) > Number(f.value);
				case 'gte': return Number(val) >= Number(f.value);
				case 'lt': return Number(val) < Number(f.value);
				case 'lte': return Number(val) <= Number(f.value);
				default: return true;
			}
		}),
	);
}

function compareValues(a: unknown, b: unknown): number {
	if ((a === null || a === undefined) && (b === null || b === undefined)) return 0;
	if (a === null || a === undefined) return -1;
	if (b === null || b === undefined) return 1;
	if (typeof a === 'number' && typeof b === 'number') return a - b;
	if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
	return valueAsFilterString(a).localeCompare(valueAsFilterString(b), undefined, { numeric: true, sensitivity: 'base' });
}

function valueAsFilterString(value: unknown): string {
	if (value === null || value === undefined) return '';
	if (Array.isArray(value)) return value.map(item => String(item)).join(', ').toLowerCase();
	if (typeof value === 'boolean') return value ? 'true' : 'false';
	return String(value).toLowerCase();
}
