/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#fields-picker
 * @task: TASK-026
 * @validated: null
 * ---
 */

import { useEffect, useRef } from 'react';
import type { DBView, Field } from 'sogo-db-core';
import { postCommand } from '../hooks/useVSCodeApi.js';

interface FieldsPickerProps {
	view: DBView;
	schema: Field[];
	onClose: () => void;
}

export function FieldsPicker({ view, schema, onClose }: FieldsPickerProps) {
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

	function toggleField(fieldId: string) {
		const hidden = [...view.hiddenFields];
		const idx = hidden.indexOf(fieldId);
		if (idx >= 0) {
			hidden.splice(idx, 1);
		} else {
			hidden.push(fieldId);
		}
		postCommand({ type: 'update-view', viewId: view.id, changes: { hiddenFields: hidden } });
	}

	function showAll() {
		postCommand({ type: 'update-view', viewId: view.id, changes: { hiddenFields: [] } });
	}

	function hideAll() {
		// Keep first text field visible (title)
		const titleField = schema.find((f) => f.type === 'text');
		const hidden = schema.filter((f) => f.id !== titleField?.id).map((f) => f.id);
		postCommand({ type: 'update-view', viewId: view.id, changes: { hiddenFields: hidden } });
	}

	return (
		<div
			ref={panelRef}
			className="absolute right-0 top-full z-50 mt-1 rounded shadow-lg p-3 min-w-[200px]"
			style={{ backgroundColor: 'var(--vscode-dropdown-background)', border: '1px solid var(--vscode-dropdown-border)' }}
		>
			<div className="flex items-center justify-between mb-2">
				<div className="text-xs font-medium">Fields</div>
				<div className="flex gap-2">
					<button className="text-xs opacity-60 hover:opacity-100" onClick={showAll}>Show all</button>
					<button className="text-xs opacity-60 hover:opacity-100" onClick={hideAll}>Hide all</button>
				</div>
			</div>
			{schema.map((field) => (
				<label key={field.id} className="flex items-center gap-2 py-0.5 text-xs cursor-pointer">
					<input
						type="checkbox"
						checked={!view.hiddenFields.includes(field.id)}
						onChange={() => toggleField(field.id)}
					/>
					{field.name}
					<span className="ml-auto opacity-40">{field.type}</span>
				</label>
			))}
		</div>
	);
}
