/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#toolbar
 * @task: TASK-022
 * @validated: null
 * ---
 */

import { useState } from 'react';
import type { DBView, Field } from 'sogo-db-core';
import { postCommand } from '../hooks/useVSCodeApi.js';
import { SortFilterPanel } from './SortFilterPanel.js';
import { FieldsPicker } from './FieldsPicker.js';

interface ToolbarProps {
	view: DBView;
	schema: Field[];
}

export function Toolbar({ view, schema }: ToolbarProps) {
	const [showSort, setShowSort] = useState(false);
	const [showFilter, setShowFilter] = useState(false);
	const [showFields, setShowFields] = useState(false);

	const sortCount = view.sort.length;
	const filterCount = view.filter.length;
	const hiddenCount = view.hiddenFields.length;

	return (
		<div className="flex items-center gap-2 px-3 py-1.5 border-b text-xs" style={{ borderColor: 'var(--vscode-panel-border)' }}>
			<button
				className="rounded px-2 py-1 hover:opacity-80"
				style={{
					backgroundColor: 'var(--vscode-button-background)',
					color: 'var(--vscode-button-foreground)',
				}}
				onClick={() => postCommand({ type: 'create-record' })}
			>
				+ New
			</button>

			<div className="flex-1" />

			<div className="relative">
				<button
					className="rounded px-2 py-1 hover:opacity-80"
					style={{
						backgroundColor: sortCount > 0 ? 'var(--vscode-button-background)' : 'transparent',
						color: sortCount > 0 ? 'var(--vscode-button-foreground)' : 'var(--vscode-foreground)',
					}}
					onClick={() => { setShowSort(!showSort); setShowFilter(false); setShowFields(false); }}
				>
					Sort{sortCount > 0 ? ` (${sortCount})` : ''}
				</button>
				{showSort && (
					<SortFilterPanel
						mode="sort"
						view={view}
						schema={schema}
						onClose={() => setShowSort(false)}
					/>
				)}
			</div>

			<div className="relative">
				<button
					className="rounded px-2 py-1 hover:opacity-80"
					style={{
						backgroundColor: filterCount > 0 ? 'var(--vscode-button-background)' : 'transparent',
						color: filterCount > 0 ? 'var(--vscode-button-foreground)' : 'var(--vscode-foreground)',
					}}
					onClick={() => { setShowFilter(!showFilter); setShowSort(false); setShowFields(false); }}
				>
					Filter{filterCount > 0 ? ` (${filterCount})` : ''}
				</button>
				{showFilter && (
					<SortFilterPanel
						mode="filter"
						view={view}
						schema={schema}
						onClose={() => setShowFilter(false)}
					/>
				)}
			</div>

			<div className="relative">
				<button
					className="rounded px-2 py-1 hover:opacity-80"
					style={{
						backgroundColor: hiddenCount > 0 ? 'var(--vscode-button-background)' : 'transparent',
						color: hiddenCount > 0 ? 'var(--vscode-button-foreground)' : 'var(--vscode-foreground)',
					}}
					onClick={() => { setShowFields(!showFields); setShowSort(false); setShowFilter(false); }}
				>
					Fields{hiddenCount > 0 ? ` (${hiddenCount} hidden)` : ''}
				</button>
				{showFields && (
					<FieldsPicker
						view={view}
						schema={schema}
						onClose={() => setShowFields(false)}
					/>
				)}
			</div>
		</div>
	);
}
