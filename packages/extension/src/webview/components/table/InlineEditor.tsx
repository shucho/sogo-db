/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#inline-editing
 * @task: TASK-025
 * @validated: null
 * ---
 */

import { useState, useRef, useEffect } from 'react';
import type { Database, DBRecord, Field } from 'sogo-db-core';
import { STATUS_OPTIONS } from 'sogo-db-core';

interface InlineEditorProps {
	record: DBRecord;
	field: Field;
	database: Database;
	onSave: (value: string | number | boolean | string[] | null) => void;
	onCancel: () => void;
}

export function InlineEditor({ record, field, onSave, onCancel }: InlineEditorProps) {
	const currentValue = record[field.id];
	const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

	useEffect(() => {
		inputRef.current?.focus();
	}, []);

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === 'Escape') onCancel();
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			(e.target as HTMLElement).blur();
		}
	}

	const inputStyle = {
		backgroundColor: 'var(--vscode-input-background)',
		color: 'var(--vscode-input-foreground)',
		border: '1px solid var(--vscode-focusBorder)',
	};

	switch (field.type) {
		case 'text':
		case 'email':
		case 'phone':
		case 'url':
			return (
				<input
					ref={inputRef as React.RefObject<HTMLInputElement>}
					className="w-full rounded px-1 py-0.5 text-xs"
					style={inputStyle}
					defaultValue={(currentValue as string) ?? ''}
					onBlur={(e) => onSave(e.target.value || null)}
					onKeyDown={handleKeyDown}
				/>
			);

		case 'number':
			return (
				<input
					ref={inputRef as React.RefObject<HTMLInputElement>}
					type="number"
					className="w-full rounded px-1 py-0.5 text-xs"
					style={inputStyle}
					defaultValue={currentValue != null ? String(currentValue) : ''}
					onBlur={(e) => {
						const v = e.target.value;
						onSave(v === '' ? null : Number(v));
					}}
					onKeyDown={handleKeyDown}
				/>
			);

		case 'date':
			return (
				<input
					ref={inputRef as React.RefObject<HTMLInputElement>}
					type="date"
					className="w-full rounded px-1 py-0.5 text-xs"
					style={inputStyle}
					defaultValue={(currentValue as string) ?? ''}
					onBlur={(e) => onSave(e.target.value || null)}
					onKeyDown={handleKeyDown}
				/>
			);

		case 'checkbox':
			return (
				<input
					type="checkbox"
					checked={currentValue === true}
					onChange={(e) => onSave(e.target.checked)}
				/>
			);

		case 'status': {
			const options = STATUS_OPTIONS as readonly string[];
			return (
				<select
					ref={inputRef as React.RefObject<HTMLSelectElement>}
					className="w-full rounded px-1 py-0.5 text-xs"
					style={inputStyle}
					defaultValue={(currentValue as string) ?? ''}
					onBlur={(e) => onSave(e.target.value || null)}
					onChange={(e) => onSave(e.target.value || null)}
				>
					<option value="">—</option>
					{options.map((opt) => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
			);
		}

		case 'select': {
			const options = field.options ?? [];
			return (
				<select
					ref={inputRef as React.RefObject<HTMLSelectElement>}
					className="w-full rounded px-1 py-0.5 text-xs"
					style={inputStyle}
					defaultValue={(currentValue as string) ?? ''}
					onBlur={(e) => onSave(e.target.value || null)}
					onChange={(e) => onSave(e.target.value || null)}
				>
					<option value="">—</option>
					{options.map((opt) => (
						<option key={opt} value={opt}>{opt}</option>
					))}
				</select>
			);
		}

		case 'multiselect': {
			const options = field.options ?? [];
			const selected = Array.isArray(currentValue) ? currentValue : [];
			return (
				<MultiSelectEditor
					options={options}
					selected={selected}
					onSave={onSave}
					onCancel={onCancel}
				/>
			);
		}

		default:
			return (
				<input
					ref={inputRef as React.RefObject<HTMLInputElement>}
					className="w-full rounded px-1 py-0.5 text-xs"
					style={inputStyle}
					defaultValue={String(currentValue ?? '')}
					onBlur={(e) => onSave(e.target.value || null)}
					onKeyDown={handleKeyDown}
				/>
			);
	}
}

function MultiSelectEditor({
	options,
	selected,
	onSave,
	onCancel,
}: {
	options: string[];
	selected: string[];
	onSave: (value: string[]) => void;
	onCancel: () => void;
}) {
	const [current, setCurrent] = useState<string[]>(selected);
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (ref.current && !ref.current.contains(e.target as Node)) {
				onSave(current);
			}
		}
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, [current, onSave]);

	return (
		<div ref={ref} className="flex flex-wrap gap-0.5">
			{options.map((opt) => (
				<label key={opt} className="flex items-center gap-1 text-xs cursor-pointer">
					<input
						type="checkbox"
						checked={current.includes(opt)}
						onChange={(e) => {
							setCurrent(
								e.target.checked
									? [...current, opt]
									: current.filter((v) => v !== opt),
							);
						}}
					/>
					{opt}
				</label>
			))}
		</div>
	);
}
