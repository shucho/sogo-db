/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#schema-migration
 * @task: TASK-006
 * @validated: null
 * ---
 */

import type { Database, Field } from './types.js';

export function migrateSchema(db: Database, newSchema: Field[]): void {
	const oldSchema = db.schema ?? [];
	const newFieldById = new Map(newSchema.map(f => [f.id, f]));
	const newFieldIds = new Set(newSchema.map(f => f.id));

	for (const record of db.records) {
		for (const oldField of oldSchema) {
			if (!newFieldIds.has(oldField.id)) {
				delete record[oldField.id];
			}
		}

		for (const newField of newSchema) {
			const oldField = oldSchema.find(f => f.id === newField.id);
			const previousValue = record[newField.id];
			if (oldField && oldField.type === newField.type && previousValue !== undefined) continue;
			record[newField.id] = coerceValueForField(newField, previousValue);
		}
	}

	const fallbackGroupBy = newSchema.find(f => f.type === 'status' || f.type === 'select')?.id;
	for (const view of db.views) {
		view.sort = (view.sort ?? []).filter(s => newFieldById.has(s.fieldId));
		view.filter = (view.filter ?? []).filter(f => newFieldById.has(f.fieldId));
		view.hiddenFields = (view.hiddenFields ?? []).filter(id => newFieldById.has(id));
		if (view.fieldOrder) {
			const order = view.fieldOrder.filter(id => newFieldById.has(id));
			for (const field of newSchema) {
				if (!order.includes(field.id)) order.push(field.id);
			}
			view.fieldOrder = order;
		}
		if (view.columnWidths) {
			const kept: Record<string, number> = {};
			for (const [fieldId, width] of Object.entries(view.columnWidths)) {
				if (newFieldById.has(fieldId)) kept[fieldId] = width;
			}
			view.columnWidths = kept;
		}
		if ((view.type === 'kanban' || view.type === 'gallery') && (!view.groupBy || !newFieldById.has(view.groupBy))) {
			view.groupBy = fallbackGroupBy;
		}
	}

	db.schema = newSchema.map(f => ({ ...f, options: f.options ? [...f.options] : undefined }));
}

export function coerceValueForField(
	field: Field,
	value: unknown,
): string | number | boolean | string[] | null {
	if (value === undefined || value === null || value === '') {
		if (field.type === 'multiselect' || field.type === 'relation') return [];
		if (field.type === 'rollup' || field.type === 'formula') return null;
		if (field.type === 'createdAt' || field.type === 'lastEditedAt') return new Date().toISOString();
		return null;
	}

	switch (field.type) {
		case 'number': {
			const num = typeof value === 'number' ? value : Number(value);
			return Number.isFinite(num) ? num : null;
		}
		case 'checkbox':
			if (typeof value === 'boolean') return value;
			if (typeof value === 'number') return value !== 0;
			if (typeof value === 'string') {
				const normalized = value.trim().toLowerCase();
				return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'on';
			}
			return false;
		case 'multiselect':
			if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
			if (typeof value === 'string') return value.split(/[;,]/).map(item => item.trim()).filter(Boolean);
			return [];
		case 'relation':
			if (Array.isArray(value)) return value.map(item => String(item)).filter(Boolean);
			if (typeof value === 'string') return value.split(/[;,]/).map(item => item.trim()).filter(Boolean);
			return [];
		case 'rollup':
		case 'formula':
			return null;
		case 'select':
		case 'status': {
			const normalized = Array.isArray(value) ? (value[0] ?? null) : value;
			const candidate = (normalized === null || normalized === undefined) ? null : String(normalized);
			if (!candidate) return null;
			if (field.options?.length && !field.options.includes(candidate)) return null;
			return candidate;
		}
		case 'createdAt':
		case 'lastEditedAt':
		case 'text':
		case 'date':
		case 'url':
		case 'email':
		case 'phone':
			return String(value);
	}
}
