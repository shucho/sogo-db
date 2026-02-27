/**
 * ---
 * @anchor: .patterns/mcp-tool
 * @spec: specs/mcp-server.md#field-name-resolution
 * @task: TASK-013
 * @validated: null
 * ---
 */

import type { Database, DBRecord, Field } from 'sogo-db-core';

/**
 * Resolve a field name (case-insensitive) to a Field object.
 * Throws if not found or ambiguous.
 */
export function resolveField(schema: Field[], name: string): Field {
	const lower = name.toLowerCase();
	const matches = schema.filter(f => f.name.toLowerCase() === lower);
	if (matches.length === 1) return matches[0];
	if (matches.length > 1) {
		throw new Error(`Ambiguous field name "${name}" — matches: ${matches.map(f => f.name).join(', ')}`);
	}
	// Try partial match
	const partial = schema.filter(f => f.name.toLowerCase().includes(lower));
	if (partial.length === 1) return partial[0];
	throw new Error(`Field "${name}" not found. Available: ${schema.map(f => f.name).join(', ')}`);
}

/**
 * Convert a record from field-ID keys to field-name keys.
 */
export function recordToNamedFields(record: DBRecord, schema: Field[]): Record<string, unknown> {
	const result: Record<string, unknown> = { id: record.id };
	for (const field of schema) {
		const val = record[field.id];
		if (val !== undefined) result[field.name] = val;
	}
	if (record._body !== undefined) result._body = record._body;
	return result;
}

/**
 * Convert field-name keys to field-ID keys for a record.
 */
export function namedFieldsToRecord(
	values: Record<string, unknown>,
	schema: Field[],
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, val] of Object.entries(values)) {
		if (key === 'id' || key === '_body') {
			result[key] = val;
			continue;
		}
		const field = resolveField(schema, key);
		result[field.id] = val;
	}
	return result;
}

/**
 * Build a summary of a database for listing.
 */
export function databaseSummary(db: Database, scope: string) {
	return {
		id: db.id,
		name: db.name,
		scope,
		fields: db.schema.map(f => ({ name: f.name, type: f.type })),
		recordCount: db.records.length,
		views: db.views.map(v => ({ name: v.name, type: v.type })),
	};
}
