/**
 * ---
 * @anchor: .patterns/npm-package
 * @spec: specs/vscode-extension.md#protocol
 * @task: TASK-037
 * @validated: null
 * ---
 *
 * Tests for the message protocol types and message construction.
 */

import { describe, it, expect } from 'vitest';
import type {
	DatabaseSnapshot,
	ThemeUpdate,
	UpdateRecordCommand,
	CreateRecordCommand,
	DeleteRecordCommand,
	MoveRecordCommand,
	SwitchViewCommand,
	CreateViewCommand,
	UpdateViewCommand,
	DeleteViewCommand,
	UpdateSchemaCommand,
	WebviewCommand,
} from '../host/protocol.js';

describe('protocol types', () => {
	it('DatabaseSnapshot has correct shape', () => {
		const msg: DatabaseSnapshot = {
			type: 'snapshot',
			database: {
				id: 'db-1',
				name: 'Test',
				schema: [],
				views: [],
				records: [],
			},
			activeViewId: 'view-1',
			processedRecords: [],
			allDatabases: [{ id: 'db-1', name: 'Test' }],
		};
		expect(msg.type).toBe('snapshot');
		expect(msg.database.id).toBe('db-1');
	});

	it('ThemeUpdate has correct shape', () => {
		const msg: ThemeUpdate = { type: 'theme', kind: 'dark' };
		expect(msg.type).toBe('theme');
		expect(msg.kind).toBe('dark');
	});

	it('UpdateRecordCommand has correct shape', () => {
		const msg: UpdateRecordCommand = {
			type: 'update-record',
			recordId: 'rec-1',
			fieldId: 'field-1',
			value: 'hello',
		};
		expect(msg.type).toBe('update-record');
	});

	it('CreateRecordCommand supports optional values', () => {
		const msg: CreateRecordCommand = { type: 'create-record' };
		expect(msg.values).toBeUndefined();

		const msg2: CreateRecordCommand = {
			type: 'create-record',
			values: { 'field-1': 'value' },
		};
		expect(msg2.values).toBeDefined();
	});

	it('DeleteRecordCommand has correct shape', () => {
		const msg: DeleteRecordCommand = {
			type: 'delete-record',
			recordId: 'rec-1',
		};
		expect(msg.type).toBe('delete-record');
	});

	it('MoveRecordCommand has correct shape', () => {
		const msg: MoveRecordCommand = {
			type: 'move-record',
			recordId: 'rec-1',
			fieldId: 'status-field',
			value: 'Done',
		};
		expect(msg.type).toBe('move-record');
	});

	it('SwitchViewCommand has correct shape', () => {
		const msg: SwitchViewCommand = {
			type: 'switch-view',
			viewId: 'view-2',
		};
		expect(msg.type).toBe('switch-view');
	});

	it('CreateViewCommand has correct shape', () => {
		const msg: CreateViewCommand = {
			type: 'create-view',
			name: 'Board',
			viewType: 'kanban',
		};
		expect(msg.type).toBe('create-view');
		expect(msg.viewType).toBe('kanban');
	});

	it('UpdateViewCommand has correct shape', () => {
		const msg: UpdateViewCommand = {
			type: 'update-view',
			viewId: 'view-1',
			changes: {
				sort: [{ fieldId: 'f1', direction: 'asc' }],
				hiddenFields: ['f2'],
			},
		};
		expect(msg.type).toBe('update-view');
	});

	it('DeleteViewCommand has correct shape', () => {
		const msg: DeleteViewCommand = {
			type: 'delete-view',
			viewId: 'view-1',
		};
		expect(msg.type).toBe('delete-view');
	});

	it('UpdateSchemaCommand has correct shape', () => {
		const msg: UpdateSchemaCommand = {
			type: 'update-schema',
			schema: [
				{ id: 'f1', name: 'Title', type: 'text' },
				{ id: 'f2', name: 'Status', type: 'status' },
			],
		};
		expect(msg.schema).toHaveLength(2);
	});

	it('WebviewCommand union includes all types', () => {
		const commands: WebviewCommand[] = [
			{ type: 'update-record', recordId: 'r', fieldId: 'f', value: 'v' },
			{ type: 'create-record' },
			{ type: 'delete-record', recordId: 'r' },
			{ type: 'move-record', recordId: 'r', fieldId: 'f', value: 'v' },
			{ type: 'switch-view', viewId: 'v' },
			{ type: 'create-view', name: 'n', viewType: 'table' },
			{ type: 'update-view', viewId: 'v', changes: {} },
			{ type: 'delete-view', viewId: 'v' },
			{ type: 'update-schema', schema: [] },
			{ type: 'open-record', recordId: 'r' },
			{ type: 'ready' },
		];
		expect(commands).toHaveLength(11);
	});
});

describe('constants', () => {
	it('exports expected values', async () => {
		const { EXTENSION_ID, EDITOR_VIEW_TYPE, TREE_VIEW_ID, COMMANDS, CONFIG } = await import(
			'../host/constants.js'
		);
		expect(EXTENSION_ID).toBe('sogo-db');
		expect(EDITOR_VIEW_TYPE).toBe('sogo-db.databaseEditor');
		expect(TREE_VIEW_ID).toBe('sogo-db.databaseList');
		expect(COMMANDS.createDatabase).toBe('sogo-db.createDatabase');
		expect(CONFIG.globalPaths).toBe('sogo-db.globalPaths');
	});
});
