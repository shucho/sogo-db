/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#tree-provider
 * @task: TASK-018
 * @validated: null
 * ---
 *
 * Sidebar TreeDataProvider showing Global and Workspace database groups.
 */

import * as vscode from 'vscode';
import { EDITOR_VIEW_TYPE } from './constants.js';
import type { DatabaseManager, DatabaseEntry } from './DatabaseManager.js';

type TreeItem = GroupItem | DatabaseItem;

class GroupItem extends vscode.TreeItem {
	constructor(
		public readonly scope: 'global' | 'workspace',
		public readonly entries: DatabaseEntry[],
	) {
		super(
			scope === 'global' ? 'Global' : 'Workspace',
			vscode.TreeItemCollapsibleState.Expanded,
		);
		this.contextValue = 'databaseGroup';
		this.iconPath = new vscode.ThemeIcon(scope === 'global' ? 'globe' : 'folder');
	}
}

class DatabaseItem extends vscode.TreeItem {
	constructor(public readonly entry: DatabaseEntry) {
		super(entry.db.name, vscode.TreeItemCollapsibleState.None);
		this.contextValue = 'database';
		this.iconPath = new vscode.ThemeIcon('database');
		this.description = `${entry.db.records.length} records`;
		this.tooltip = `${entry.db.name}\n${entry.path}\n${entry.db.records.length} records, ${entry.db.views.length} views`;
		this.command = {
			command: 'vscode.openWith',
			title: 'Open Database',
			arguments: [vscode.Uri.file(entry.path), EDITOR_VIEW_TYPE],
		};
	}
}

export class DatabaseTreeProvider implements vscode.TreeDataProvider<TreeItem> {
	private readonly _onDidChangeTreeData = new vscode.EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	constructor(private readonly manager: DatabaseManager) {
		manager.onDidChange(() => this._onDidChangeTreeData.fire(undefined));
	}

	getTreeItem(element: TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element?: TreeItem): TreeItem[] {
		if (!element) {
			const all = this.manager.getAll();
			const global = all.filter((e) => e.scope === 'global');
			const workspace = all.filter((e) => e.scope === 'workspace');
			const groups: TreeItem[] = [];
			if (global.length > 0) groups.push(new GroupItem('global', global));
			if (workspace.length > 0) groups.push(new GroupItem('workspace', workspace));
			return groups;
		}
		if (element instanceof GroupItem) {
			return element.entries.map((e) => new DatabaseItem(e));
		}
		return [];
	}

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	dispose(): void {
		this._onDidChangeTreeData.dispose();
	}
}
