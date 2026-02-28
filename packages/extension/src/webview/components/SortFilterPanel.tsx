/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#sort-filter
 * @task: TASK-026
 * @validated: null
 * ---
 */

import { useEffect, useRef } from 'react';
import type { DBView, Field } from 'sogo-db-core';
import { postCommand } from '../hooks/useVSCodeApi.js';

const FILTER_OPS = [
	{ value: 'contains', label: 'contains' },
	{ value: 'not_contains', label: 'does not contain' },
	{ value: 'equals', label: 'equals' },
	{ value: 'not_equals', label: 'does not equal' },
	{ value: 'is_empty', label: 'is empty' },
	{ value: 'is_not_empty', label: 'is not empty' },
	{ value: 'gt', label: '>' },
	{ value: 'gte', label: '>=' },
	{ value: 'lt', label: '<' },
	{ value: 'lte', label: '<=' },
];

interface SortFilterPanelProps {
	mode: 'sort' | 'filter';
	view: DBView;
	schema: Field[];
	onClose: () => void;
}

export function SortFilterPanel({ mode, view, schema, onClose }: SortFilterPanelProps) {
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
				onClose();
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [onClose]);

	function updateView(changes: Partial<Pick<DBView, 'sort' | 'filter'>>) {
		postCommand({ type: 'update-view', viewId: view.id, changes });
	}

	if (mode === 'sort') {
		const sorts = [...view.sort];

		return (
			<div
				ref={panelRef}
				className="absolute right-0 top-full z-50 mt-1 rounded shadow-lg p-3 min-w-[280px]"
				style={{ backgroundColor: 'var(--vscode-dropdown-background)', border: '1px solid var(--vscode-dropdown-border)' }}
			>
				<div className="text-xs font-medium mb-2">Sort</div>
				{sorts.map((sort, i) => {
					const field = schema.find((f) => f.id === sort.fieldId);
					return (
						<div key={i} className="flex items-center gap-1 mb-1">
							<select
								className="flex-1 rounded px-1 py-0.5 text-xs"
								style={{ backgroundColor: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)' }}
								value={sort.fieldId}
								onChange={(e) => {
									sorts[i] = { ...sort, fieldId: e.target.value };
									updateView({ sort: sorts });
								}}
							>
								{schema.map((f) => (
									<option key={f.id} value={f.id}>{f.name}</option>
								))}
							</select>
							<select
								className="rounded px-1 py-0.5 text-xs"
								style={{ backgroundColor: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)' }}
								value={sort.direction}
								onChange={(e) => {
									sorts[i] = { ...sort, direction: e.target.value as 'asc' | 'desc' };
									updateView({ sort: sorts });
								}}
							>
								<option value="asc">Asc</option>
								<option value="desc">Desc</option>
							</select>
							<button
								className="text-xs opacity-50 hover:opacity-100 px-1"
								onClick={() => {
									sorts.splice(i, 1);
									updateView({ sort: sorts });
								}}
							>
								x
							</button>
						</div>
					);
				})}
				<button
					className="text-xs opacity-60 hover:opacity-100 mt-1"
					onClick={() => {
						sorts.push({ fieldId: schema[0]?.id ?? '', direction: 'asc' });
						updateView({ sort: sorts });
					}}
				>
					+ Add sort
				</button>
			</div>
		);
	}

	// Filter mode
	const filters = [...view.filter];

	return (
		<div
			ref={panelRef}
			className="absolute right-0 top-full z-50 mt-1 rounded shadow-lg p-3 min-w-[340px]"
			style={{ backgroundColor: 'var(--vscode-dropdown-background)', border: '1px solid var(--vscode-dropdown-border)' }}
		>
			<div className="text-xs font-medium mb-2">Filter</div>
			{filters.map((f, i) => (
				<div key={i} className="flex items-center gap-1 mb-1">
					<select
						className="rounded px-1 py-0.5 text-xs"
						style={{ backgroundColor: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)' }}
						value={f.fieldId}
						onChange={(e) => {
							filters[i] = { ...f, fieldId: e.target.value };
							updateView({ filter: filters });
						}}
					>
						{schema.map((s) => (
							<option key={s.id} value={s.id}>{s.name}</option>
						))}
					</select>
					<select
						className="rounded px-1 py-0.5 text-xs"
						style={{ backgroundColor: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)' }}
						value={f.op}
						onChange={(e) => {
							filters[i] = { ...f, op: e.target.value };
							updateView({ filter: filters });
						}}
					>
						{FILTER_OPS.map((op) => (
							<option key={op.value} value={op.value}>{op.label}</option>
						))}
					</select>
					{!['is_empty', 'is_not_empty'].includes(f.op) && (
						<input
							className="flex-1 rounded px-1 py-0.5 text-xs"
							style={{ backgroundColor: 'var(--vscode-input-background)', color: 'var(--vscode-input-foreground)' }}
							value={f.value}
							onChange={(e) => {
								filters[i] = { ...f, value: e.target.value };
								updateView({ filter: filters });
							}}
						/>
					)}
					<button
						className="text-xs opacity-50 hover:opacity-100 px-1"
						onClick={() => {
							filters.splice(i, 1);
							updateView({ filter: filters });
						}}
					>
						x
					</button>
				</div>
			))}
			<button
				className="text-xs opacity-60 hover:opacity-100 mt-1"
				onClick={() => {
					filters.push({ fieldId: schema[0]?.id ?? '', op: 'contains', value: '' });
					updateView({ filter: filters });
				}}
			>
				+ Add filter
			</button>
		</div>
	);
}
