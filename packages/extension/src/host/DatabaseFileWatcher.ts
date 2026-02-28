/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#file-watcher
 * @task: TASK-019
 * @validated: null
 * ---
 *
 * Watches *.db.json files for changes, debounced, suppresses self-triggered events.
 */

import * as vscode from 'vscode';
import { getGlobalDatabasePath } from 'sogo-db-core';
import type { DatabaseManager } from './DatabaseManager.js';

export class DatabaseFileWatcher {
	private readonly disposables: vscode.Disposable[] = [];
	private debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

	constructor(private readonly manager: DatabaseManager) {}

	start(): void {
		// Watch workspace .db.json files
		const workspaceWatcher = vscode.workspace.createFileSystemWatcher('**/*.db.json');
		workspaceWatcher.onDidChange((uri) => this.onFileChanged(uri));
		workspaceWatcher.onDidCreate((uri) => this.onFileChanged(uri));
		workspaceWatcher.onDidDelete((uri) => this.onFileDeleted(uri));
		this.disposables.push(workspaceWatcher);

		// Watch global databases directory
		const globalPath = getGlobalDatabasePath();
		const globalPattern = new vscode.RelativePattern(vscode.Uri.file(globalPath), '**/*.db.json');
		const globalWatcher = vscode.workspace.createFileSystemWatcher(globalPattern);
		globalWatcher.onDidChange((uri) => this.onFileChanged(uri));
		globalWatcher.onDidCreate((uri) => this.onFileChanged(uri));
		globalWatcher.onDidDelete((uri) => this.onFileDeleted(uri));
		this.disposables.push(globalWatcher);
	}

	private onFileChanged(uri: vscode.Uri): void {
		const filePath = uri.fsPath;

		// Suppress self-triggered events
		if (this.manager.isWriting(filePath)) return;

		// Debounce: 300ms
		const existing = this.debounceTimers.get(filePath);
		if (existing) clearTimeout(existing);

		this.debounceTimers.set(
			filePath,
			setTimeout(() => {
				this.debounceTimers.delete(filePath);
				this.manager.reloadFile(filePath);
			}, 300),
		);
	}

	private onFileDeleted(uri: vscode.Uri): void {
		this.manager.removeByPath(uri.fsPath);
	}

	dispose(): void {
		for (const timer of this.debounceTimers.values()) {
			clearTimeout(timer);
		}
		this.debounceTimers.clear();
		for (const d of this.disposables) {
			d.dispose();
		}
	}
}
