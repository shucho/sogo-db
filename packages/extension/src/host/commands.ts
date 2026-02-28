/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#commands
 * @task: TASK-034
 * @validated: null
 * ---
 *
 * Command palette handlers.
 */

import * as vscode from 'vscode';
import { exportCsv, importCsvRecords, getGlobalDatabasePath } from 'sogo-db-core';
import { COMMANDS, EDITOR_VIEW_TYPE } from './constants.js';
import type { DatabaseManager } from './DatabaseManager.js';

export function registerCommands(
	context: vscode.ExtensionContext,
	manager: DatabaseManager,
): void {
	context.subscriptions.push(
		vscode.commands.registerCommand(COMMANDS.createDatabase, () => handleCreate(manager)),
		vscode.commands.registerCommand(COMMANDS.deleteDatabase, (item) => handleDelete(manager, item)),
		vscode.commands.registerCommand(COMMANDS.duplicateDatabase, (item) => handleDuplicate(manager, item)),
		vscode.commands.registerCommand(COMMANDS.exportCsv, (item) => handleExportCsv(manager, item)),
		vscode.commands.registerCommand(COMMANDS.importCsv, (item) => handleImportCsv(manager, item)),
		vscode.commands.registerCommand(COMMANDS.openAsJson, (item) => handleOpenAsJson(item)),
		vscode.commands.registerCommand(COMMANDS.refresh, () => manager.scanAll()),
	);
}

async function handleCreate(manager: DatabaseManager): Promise<void> {
	const name = await vscode.window.showInputBox({
		prompt: 'Database name',
		placeHolder: 'My Database',
		validateInput: (v) => (v.trim() ? null : 'Name is required'),
	});
	if (!name) return;

	const location = await vscode.window.showQuickPick(
		[
			{ label: 'Global', description: '~/.sogo/globalDatabases/', value: 'global' },
			...(vscode.workspace.workspaceFolders?.map((f) => ({
				label: 'Workspace',
				description: f.uri.fsPath,
				value: f.uri.fsPath,
			})) ?? []),
		],
		{ placeHolder: 'Where to create the database?' },
	);
	if (!location) return;

	const dirPath = location.value === 'global' ? getGlobalDatabasePath() : location.value;
	const entry = await manager.createNewDatabase(name, dirPath);

	await vscode.commands.executeCommand(
		'vscode.openWith',
		vscode.Uri.file(entry.path),
		EDITOR_VIEW_TYPE,
	);
}

async function handleDelete(manager: DatabaseManager, item?: { entry?: { path: string } }): Promise<void> {
	const filePath = item?.entry?.path ?? (await pickDatabase(manager));
	if (!filePath) return;

	const confirm = await vscode.window.showWarningMessage(
		'Delete this database? This cannot be undone.',
		{ modal: true },
		'Delete',
	);
	if (confirm !== 'Delete') return;

	try {
		await vscode.workspace.fs.delete(vscode.Uri.file(filePath));
		manager.removeByPath(filePath);
	} catch (err) {
		vscode.window.showErrorMessage(`Failed to delete: ${err}`);
	}
}

async function handleDuplicate(manager: DatabaseManager, item?: { entry?: { path: string } }): Promise<void> {
	const filePath = item?.entry?.path ?? (await pickDatabase(manager));
	if (!filePath) return;

	const entry = manager.getByPath(filePath);
	if (!entry) return;

	const newName = await vscode.window.showInputBox({
		prompt: 'Name for duplicate',
		value: `${entry.db.name} (copy)`,
	});
	if (!newName) return;

	const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));
	const newEntry = await manager.createNewDatabase(newName, dirPath);

	// Copy records from original
	const { writeDatabaseFile } = await import('sogo-db-core');
	newEntry.db.schema = JSON.parse(JSON.stringify(entry.db.schema));
	newEntry.db.views = JSON.parse(JSON.stringify(entry.db.views));
	// Give views new IDs
	for (const v of newEntry.db.views) {
		v.id = crypto.randomUUID();
	}
	newEntry.db.records = entry.db.records.map((r) => ({ ...r, id: crypto.randomUUID() }));
	await writeDatabaseFile(newEntry.db, newEntry.path);
}

async function handleExportCsv(manager: DatabaseManager, item?: { entry?: { path: string } }): Promise<void> {
	const filePath = item?.entry?.path ?? (await pickDatabase(manager));
	if (!filePath) return;

	const entry = manager.getByPath(filePath);
	if (!entry) return;

	const csv = exportCsv(entry.db);
	const savePath = await vscode.window.showSaveDialog({
		defaultUri: vscode.Uri.file(filePath.replace('.db.json', '.csv')),
		filters: { CSV: ['csv'] },
	});
	if (!savePath) return;

	await vscode.workspace.fs.writeFile(savePath, Buffer.from(csv, 'utf-8'));
	vscode.window.showInformationMessage(`Exported ${entry.db.records.length} records to CSV`);
}

async function handleImportCsv(manager: DatabaseManager, item?: { entry?: { path: string } }): Promise<void> {
	const filePath = item?.entry?.path ?? (await pickDatabase(manager));
	if (!filePath) return;

	const entry = manager.getByPath(filePath);
	if (!entry) return;

	const csvUri = await vscode.window.showOpenDialog({
		filters: { CSV: ['csv'] },
		canSelectMany: false,
	});
	if (!csvUri || csvUri.length === 0) return;

	const csvBytes = await vscode.workspace.fs.readFile(csvUri[0]);
	const csvText = Buffer.from(csvBytes).toString('utf-8');

	// Auto-map CSV headers to field names
	const firstLine = csvText.split('\n')[0];
	const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
	const fieldMap: Record<string, string> = {};

	for (const header of headers) {
		if (header === 'id') continue;
		const field = entry.db.schema.find(
			(f) => f.name.toLowerCase() === header.toLowerCase(),
		);
		if (field) {
			fieldMap[header] = field.id;
		}
	}

	const newRecords = importCsvRecords(entry.db, csvText, fieldMap);
	for (const record of newRecords) {
		entry.db.records.push(record);
	}

	const { writeDatabaseFile } = await import('sogo-db-core');
	await writeDatabaseFile(entry.db, entry.path);
	vscode.window.showInformationMessage(`Imported ${newRecords.length} records`);
}

async function handleOpenAsJson(item?: { entry?: { path: string } }): Promise<void> {
	const filePath = item?.entry?.path;
	if (!filePath) return;
	await vscode.commands.executeCommand('vscode.openWith', vscode.Uri.file(filePath), 'default');
}

async function pickDatabase(manager: DatabaseManager): Promise<string | undefined> {
	const entries = manager.getAll();
	if (entries.length === 0) {
		vscode.window.showInformationMessage('No databases found');
		return undefined;
	}

	const pick = await vscode.window.showQuickPick(
		entries.map((e) => ({
			label: e.db.name,
			description: e.scope,
			detail: e.path,
			path: e.path,
		})),
		{ placeHolder: 'Select a database' },
	);
	return pick?.path;
}
