/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#type-definitions
 * @task: TASK-002
 * @validated: null
 * ---
 */

export type DatabaseScope = 'global' | 'workspace';

export type FieldType =
	| 'text'
	| 'number'
	| 'select'
	| 'multiselect'
	| 'relation'
	| 'rollup'
	| 'formula'
	| 'date'
	| 'checkbox'
	| 'url'
	| 'email'
	| 'phone'
	| 'status'
	| 'createdAt'
	| 'lastEditedAt';

export const STATUS_GROUPS: Record<string, { label: string; color: string }> = {
	'Not started': { label: 'Not started', color: '#5e5e5e' },
	'In progress': { label: 'In progress', color: '#2e75d0' },
	'Done': { label: 'Done', color: '#2d9e6b' },
};

export const STATUS_OPTIONS = ['Not started', 'In progress', 'Done'] as const;

export type RollupAggregation = 'count' | 'count_not_empty' | 'sum' | 'avg' | 'min' | 'max';

export interface RelationConfig {
	targetDatabaseId?: string;
	targetRelationFieldId?: string;
}

export interface RollupConfig {
	relationFieldId: string;
	targetFieldId?: string;
	aggregation: RollupAggregation;
}

export interface FormulaConfig {
	expression: string;
}

export interface Field {
	id: string;
	name: string;
	type: FieldType;
	options?: string[];
	optionColors?: Record<string, string>;
	relation?: RelationConfig;
	rollup?: RollupConfig;
	formula?: FormulaConfig;
}

export type ViewType = 'table' | 'kanban' | 'list' | 'gallery' | 'calendar';

export interface DBView {
	id: string;
	name: string;
	type: ViewType;
	groupBy?: string;
	cardCoverField?: string;
	cardFields?: string[];
	sort: Array<{ fieldId: string; direction: 'asc' | 'desc' }>;
	filter: Array<{ fieldId: string; op: string; value: string }>;
	hiddenFields: string[];
	fieldOrder?: string[];
	columnWidths?: Record<string, number>;
}

export interface DBRecord {
	id: string;
	_body?: string;
	[fieldId: string]: string | number | boolean | string[] | null | undefined;
}

export interface Database {
	id: string;
	name: string;
	scope?: DatabaseScope;
	schema: Field[];
	views: DBView[];
	records: DBRecord[];
	headerFieldIds?: string[];
}

export type DatabaseResolver = (databaseId: string) => Database | undefined;

export const DEFAULT_OPTION_COLORS = [
	'#6b7280', '#8b6b4a', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#ef4444',
];
