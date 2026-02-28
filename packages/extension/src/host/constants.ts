/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#constants
 * @task: TASK-017
 * @validated: null
 * ---
 */

export const EXTENSION_ID = 'sogo-db';
export const EDITOR_VIEW_TYPE = 'sogo-db.databaseEditor';
export const TREE_VIEW_ID = 'sogo-db.databaseList';

export const COMMANDS = {
	createDatabase: 'sogo-db.createDatabase',
	deleteDatabase: 'sogo-db.deleteDatabase',
	duplicateDatabase: 'sogo-db.duplicateDatabase',
	exportCsv: 'sogo-db.exportCsv',
	importCsv: 'sogo-db.importCsv',
	openAsJson: 'sogo-db.openAsJson',
	refresh: 'sogo-db.refresh',
} as const;

export const CONFIG = {
	globalPaths: 'sogo-db.globalPaths',
	scanDepth: 'sogo-db.scanDepth',
	autoStartMcpServer: 'sogo-db.autoStartMcpServer',
} as const;
