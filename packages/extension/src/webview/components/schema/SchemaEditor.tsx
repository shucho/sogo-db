/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#schema-editor
 * @task: TASK-032
 * @validated: null
 * ---
 */

import { useState } from 'react';
import type { Database, Field, FieldType } from 'sogo-db-core';
import { postCommand } from '../../hooks/useVSCodeApi.js';

const FIELD_TYPES: FieldType[] = [
	'text', 'number', 'select', 'multiselect', 'status',
	'date', 'checkbox', 'url', 'email', 'phone',
	'relation', 'formula', 'rollup', 'createdAt', 'lastEditedAt',
];

interface SchemaEditorProps {
	database: Database;
	onClose: () => void;
}

export function SchemaEditor({ database, onClose }: SchemaEditorProps) {
	const [schema, setSchema] = useState<Field[]>(() => JSON.parse(JSON.stringify(database.schema)));

	function updateField(index: number, changes: Partial<Field>) {
		setSchema((prev) => {
			const next = [...prev];
			next[index] = { ...next[index], ...changes };
			return next;
		});
	}

	function addField() {
		setSchema((prev) => [
			...prev,
			{
				id: crypto.randomUUID(),
				name: 'New Field',
				type: 'text' as FieldType,
			},
		]);
	}

	function removeField(index: number) {
		setSchema((prev) => prev.filter((_, i) => i !== index));
	}

	function moveField(index: number, direction: -1 | 1) {
		setSchema((prev) => {
			const next = [...prev];
			const target = index + direction;
			if (target < 0 || target >= next.length) return prev;
			[next[index], next[target]] = [next[target], next[index]];
			return next;
		});
	}

	function handleSave() {
		postCommand({ type: 'update-schema', schema });
		onClose();
	}

	const inputStyle = {
		backgroundColor: 'var(--vscode-input-background)',
		color: 'var(--vscode-input-foreground)',
		border: '1px solid var(--vscode-input-border)',
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-start justify-center pt-12 backdrop-blur-sm"
			style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
			onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
		>
			<div
				className="w-full max-w-[560px] max-h-[80vh] overflow-y-auto rounded-lg shadow-xl"
				style={{
					backgroundColor: 'var(--vscode-editor-background)',
					border: '1px solid var(--vscode-panel-border)',
				}}
			>
				<div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--vscode-panel-border)' }}>
					<h2 className="text-sm font-semibold">Edit Schema</h2>
					<div className="flex gap-2">
						<button className="text-xs px-2 py-1 rounded hover:opacity-80" onClick={onClose}>
							Cancel
						</button>
						<button
							className="text-xs px-3 py-1 rounded hover:opacity-80"
							style={{
								backgroundColor: 'var(--vscode-button-background)',
								color: 'var(--vscode-button-foreground)',
							}}
							onClick={handleSave}
						>
							Save
						</button>
					</div>
				</div>

				<div className="p-4 space-y-2">
					{schema.map((field, i) => (
						<div key={field.id} className="flex items-center gap-2">
							<div className="flex flex-col gap-0.5">
								<button
									className="text-[10px] opacity-40 hover:opacity-100 leading-none"
									onClick={() => moveField(i, -1)}
									disabled={i === 0}
								>
									&uarr;
								</button>
								<button
									className="text-[10px] opacity-40 hover:opacity-100 leading-none"
									onClick={() => moveField(i, 1)}
									disabled={i === schema.length - 1}
								>
									&darr;
								</button>
							</div>
							<input
								className="flex-1 rounded px-2 py-1 text-xs"
								style={inputStyle}
								value={field.name}
								onChange={(e) => updateField(i, { name: e.target.value })}
							/>
							<select
								className="rounded px-2 py-1 text-xs"
								style={inputStyle}
								value={field.type}
								onChange={(e) => updateField(i, { type: e.target.value as FieldType })}
							>
								{FIELD_TYPES.map((ft) => (
									<option key={ft} value={ft}>{ft}</option>
								))}
							</select>
							{(field.type === 'select' || field.type === 'multiselect') && (
								<input
									className="flex-1 rounded px-2 py-1 text-xs"
									style={inputStyle}
									placeholder="Options (comma-separated)"
									value={(field.options ?? []).join(', ')}
									onChange={(e) =>
										updateField(i, {
											options: e.target.value
												.split(',')
												.map((s) => s.trim())
												.filter(Boolean),
										})
									}
								/>
							)}
							<button
								className="text-xs opacity-40 hover:opacity-100 px-1"
								onClick={() => removeField(i)}
								title="Remove field"
							>
								x
							</button>
						</div>
					))}
					<button
						className="text-xs opacity-60 hover:opacity-100 mt-2"
						onClick={addField}
					>
						+ Add field
					</button>
				</div>
			</div>
		</div>
	);
}
