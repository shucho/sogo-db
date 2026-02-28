/**
 * ---
 * @anchor: .patterns/npm-package
 * @spec: specs/vscode-extension.md#activation
 * @task: TASK-017
 * @validated: null
 * ---
 *
 * Extension entry point — wires up DatabaseManager, TreeView, FileWatcher, Editor, Commands.
 */

import * as vscode from 'vscode';
import { DatabaseManager } from './host/DatabaseManager.js';
import { DatabaseTreeProvider } from './host/DatabaseTreeProvider.js';
import { DatabaseFileWatcher } from './host/DatabaseFileWatcher.js';
import { DatabaseEditorProvider } from './host/DatabaseEditorProvider.js';
import { registerCommands } from './host/commands.js';
import { TREE_VIEW_ID } from './host/constants.js';

export function activate(context: vscode.ExtensionContext): void {
	const manager = new DatabaseManager(context);

	// Sidebar tree view
	const treeProvider = new DatabaseTreeProvider(manager);
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider(TREE_VIEW_ID, treeProvider),
	);

	// File watcher
	const watcher = new DatabaseFileWatcher(manager);
	watcher.start();
	context.subscriptions.push({ dispose: () => watcher.dispose() });

	// Custom editor for .db.json
	context.subscriptions.push(
		DatabaseEditorProvider.register(context, manager),
	);

	// Command palette
	registerCommands(context, manager);

	// Initial scan
	manager.scanAll();
}

export function deactivate(): void {
	// Disposables cleaned up via context.subscriptions
}
