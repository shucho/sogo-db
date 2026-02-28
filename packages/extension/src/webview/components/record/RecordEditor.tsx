/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#record-editor
 * @task: TASK-031
 * @validated: null
 * ---
 */

import { useState } from 'react';
import type { Database, DBRecord, Field } from 'sogo-db-core';
import { STATUS_OPTIONS } from 'sogo-db-core';
import { postCommand } from '../../hooks/useVSCodeApi.js';
import { ConfirmDialog } from '../shared/ConfirmDialog.js';

interface RecordEditorProps {
	record: DBRecord;
	database: Database;
	relationTitles?: Record<string, string>;
	onClose: () => void;
}

export function RecordEditor({ record, database, relationTitles, onClose }: RecordEditorProps) {
	const [confirmDelete, setConfirmDelete] = useState(false);

	function handleChange(fieldId: string, value: string | number | boolean | string[] | null) {
		postCommand({ type: 'update-record', recordId: record.id, fieldId, value });
	}

	function handleDelete() {
		postCommand({ type: 'delete-record', recordId: record.id });
		onClose();
	}

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
					<h2 className="text-sm font-semibold">Edit Record</h2>
					<div className="flex gap-2">
						<button
							className="text-xs px-2 py-1 rounded hover:opacity-80"
							style={{ color: 'var(--vscode-errorForeground)' }}
							onClick={() => setConfirmDelete(true)}
						>
							Delete
						</button>
						<button
							className="text-xs px-2 py-1 rounded hover:opacity-80"
							onClick={onClose}
						>
							Close
						</button>
					</div>
				</div>

				<div className="p-4 space-y-3">
					{database.schema.map((field) => (
						<FieldEditor
							key={field.id}
							field={field}
							value={record[field.id]}
							relationTitles={relationTitles}
							onChange={(v) => handleChange(field.id, v)}
						/>
					))}
				</div>
			</div>

			<ConfirmDialog
				open={confirmDelete}
				title="Delete record"
				message="This action cannot be undone."
				confirmLabel="Delete"
				danger
				onConfirm={handleDelete}
				onCancel={() => setConfirmDelete(false)}
			/>
		</div>
	);
}

function FieldEditor({
	field,
	value,
	relationTitles,
	onChange,
}: {
	field: Field;
	value: string | number | boolean | string[] | null | undefined;
	relationTitles?: Record<string, string>;
	onChange: (value: string | number | boolean | string[] | null) => void;
}) {
	const isComputed = field.type === 'formula' || field.type === 'rollup' || field.type === 'createdAt' || field.type === 'lastEditedAt';

	const inputStyle = {
		backgroundColor: 'var(--vscode-input-background)',
		color: 'var(--vscode-input-foreground)',
		border: '1px solid var(--vscode-input-border)',
	};

	return (
		<div>
			<label className="block text-xs font-medium mb-1 opacity-70">{field.name}</label>
			{isComputed ? (
				<div className="text-xs opacity-50 italic">{String(value ?? '—')} (computed)</div>
			) : (
				<FieldInput field={field} value={value} relationTitles={relationTitles} onChange={onChange} inputStyle={inputStyle} />
			)}
		</div>
	);
}

function FieldInput({
	field,
	value,
	relationTitles,
	onChange,
	inputStyle,
}: {
	field: Field;
	value: string | number | boolean | string[] | null | undefined;
	relationTitles?: Record<string, string>;
	onChange: (value: string | number | boolean | string[] | null) => void;
	inputStyle: React.CSSProperties;
}) {
	switch (field.type) {
		case 'text':
		case 'email':
		case 'phone':
		case 'url':
			return (
				<input
					className="w-full rounded px-2 py-1.5 text-xs"
					style={inputStyle}
					value={(value as string) ?? ''}
					onChange={(e) => onChange(e.target.value || null)}
				/>
			);
		case 'number':
			return (
				<input
					type="number"
					className="w-full rounded px-2 py-1.5 text-xs"
					style={inputStyle}
					value={value != null ? String(value) : ''}
					onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
				/>
			);
		case 'date':
			return (
				<input
					type="date"
					className="w-full rounded px-2 py-1.5 text-xs"
					style={inputStyle}
					value={(value as string) ?? ''}
					onChange={(e) => onChange(e.target.value || null)}
				/>
			);
		case 'checkbox':
			return (
				<input
					type="checkbox"
					checked={value === true}
					onChange={(e) => onChange(e.target.checked)}
				/>
			);
		case 'status':
			return (
				<select
					className="w-full rounded px-2 py-1.5 text-xs"
					style={inputStyle}
					value={(value as string) ?? ''}
					onChange={(e) => onChange(e.target.value || null)}
				>
					<option value="">—</option>
					{(STATUS_OPTIONS as readonly string[]).map((opt) => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
			);
		case 'select':
			return (
				<select
					className="w-full rounded px-2 py-1.5 text-xs"
					style={inputStyle}
					value={(value as string) ?? ''}
					onChange={(e) => onChange(e.target.value || null)}
				>
					<option value="">—</option>
					{(field.options ?? []).map((opt) => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
			);
		case 'multiselect': {
			const selected = Array.isArray(value) ? value : [];
			return (
				<div className="flex flex-wrap gap-1">
					{(field.options ?? []).map((opt) => (
						<label key={opt} className="flex items-center gap-1 text-xs cursor-pointer">
							<input
								type="checkbox"
								checked={selected.includes(opt)}
								onChange={(e) => {
									const next = e.target.checked
										? [...selected, opt]
										: selected.filter((v) => v !== opt);
									onChange(next);
								}}
							/>
							{opt}
						</label>
					))}
				</div>
			);
		}
		case 'relation': {
			const ids = Array.isArray(value) ? value : [];
			return (
				<div className="space-y-1">
					{ids.length > 0 ? (
						ids.map((id) => (
							<div
								key={id}
								className="inline-block mr-1 mb-1 px-2 py-0.5 rounded text-xs"
								style={{
									backgroundColor: 'var(--vscode-badge-background)',
									color: 'var(--vscode-badge-foreground)',
								}}
							>
								{relationTitles?.[id] ?? id.slice(0, 8)}
							</div>
						))
					) : (
						<span className="text-xs opacity-40">No linked records</span>
					)}
				</div>
			);
		}
		default:
			return (
				<input
					className="w-full rounded px-2 py-1.5 text-xs"
					style={inputStyle}
					value={String(value ?? '')}
					onChange={(e) => onChange(e.target.value || null)}
				/>
			);
	}
}
