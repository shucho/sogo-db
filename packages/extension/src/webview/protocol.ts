/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#protocol
 * @task: TASK-021
 * @validated: null
 * ---
 *
 * Re-exports protocol types for the webview.
 * NOTE: This is a copy of the type definitions from host/protocol.ts.
 * esbuild bundles both sides separately so we can't share the import at runtime.
 */

import type { Database, DBRecord, DBView, Field, ViewType } from 'sogo-db-core';

// ── Host → Webview ─────────────────────────────────────────────

export interface DatabaseSnapshot {
	type: 'snapshot';
	database: Database;
	activeViewId: string;
	processedRecords: DBRecord[];
	allDatabases: Array<{ id: string; name: string }>;
	/** Pre-resolved map of record ID → display title for relation fields */
	relationTitles: Record<string, string>;
}

export interface ThemeUpdate {
	type: 'theme';
	kind: 'light' | 'dark' | 'high-contrast';
}

export type HostMessage = DatabaseSnapshot | ThemeUpdate;

// ── Webview → Host ─────────────────────────────────────────────

export interface UpdateRecordCommand {
	type: 'update-record';
	recordId: string;
	fieldId: string;
	value: string | number | boolean | string[] | null;
}

export interface CreateRecordCommand {
	type: 'create-record';
	values?: Record<string, string | number | boolean | string[] | null>;
}

export interface DeleteRecordCommand {
	type: 'delete-record';
	recordId: string;
}

export interface MoveRecordCommand {
	type: 'move-record';
	recordId: string;
	fieldId: string;
	value: string;
}

export interface SwitchViewCommand {
	type: 'switch-view';
	viewId: string;
}

export interface CreateViewCommand {
	type: 'create-view';
	name: string;
	viewType: ViewType;
}

export interface UpdateViewCommand {
	type: 'update-view';
	viewId: string;
	changes: Partial<Pick<DBView, 'name' | 'sort' | 'filter' | 'hiddenFields' | 'fieldOrder' | 'groupBy' | 'columnWidths'>>;
}

export interface DeleteViewCommand {
	type: 'delete-view';
	viewId: string;
}

export interface UpdateSchemaCommand {
	type: 'update-schema';
	schema: Field[];
}

export interface OpenRecordCommand {
	type: 'open-record';
	recordId: string;
}

export interface ReadyCommand {
	type: 'ready';
}

export type WebviewCommand =
	| UpdateRecordCommand
	| CreateRecordCommand
	| DeleteRecordCommand
	| MoveRecordCommand
	| SwitchViewCommand
	| CreateViewCommand
	| UpdateViewCommand
	| DeleteViewCommand
	| UpdateSchemaCommand
	| OpenRecordCommand
	| ReadyCommand;
