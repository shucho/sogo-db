/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#rollup-engine
 * @task: TASK-004
 * @validated: null
 * ---
 */

import type { Database, DatabaseResolver, DBRecord, Field } from './types.js';
import { getRelationTargetDatabase } from './relations.js';

export function computeRollupValue(
	record: DBRecord,
	field: Field,
	db: Database,
	resolveDatabase?: DatabaseResolver,
): number | null {
	const rollup = field.rollup;
	if (!rollup) return null;

	const relationField = db.schema.find(f => f.id === rollup.relationFieldId && f.type === 'relation');
	if (!relationField) return null;

	const targetDb = getRelationTargetDatabase(db, relationField, resolveDatabase);
	const rawLinked = record[relationField.id];
	const linkedIds = Array.isArray(rawLinked) ? rawLinked.map(id => String(id)) : [];

	if (!linkedIds.length) {
		return rollup.aggregation === 'count' ? 0 : null;
	}

	const linkedRecords = targetDb.records.filter(r => linkedIds.includes(r.id));
	if (!linkedRecords.length) {
		return rollup.aggregation === 'count' ? 0 : null;
	}

	if (rollup.aggregation === 'count') return linkedRecords.length;

	if (rollup.aggregation === 'count_not_empty') {
		const target = rollup.targetFieldId;
		if (!target) return 0;
		return linkedRecords.filter(r => {
			const value = r[target];
			return value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
		}).length;
	}

	const targetFieldId = rollup.targetFieldId;
	if (!targetFieldId) return null;

	const nums = linkedRecords
		.map(r => Number(r[targetFieldId]))
		.filter(v => Number.isFinite(v));
	if (!nums.length) return null;

	switch (rollup.aggregation) {
		case 'sum': return nums.reduce((sum, v) => sum + v, 0);
		case 'avg': return nums.reduce((sum, v) => sum + v, 0) / nums.length;
		case 'min': return Math.min(...nums);
		case 'max': return Math.max(...nums);
		default: return null;
	}
}
