/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#table-view
 * @task: TASK-024
 * @validated: null
 * ---
 */

import type { Database, DBRecord, Field } from 'sogo-db-core';
import { getFieldDisplayValue, getStatusColor, getFieldOptionColor } from 'sogo-db-core';
import { Badge } from '../shared/Badge.js';

interface TableCellProps {
	record: DBRecord;
	field: Field;
	database: Database;
	relationTitles?: Record<string, string>;
	onStartEdit: () => void;
}

export function TableCell({ record, field, database, relationTitles, onStartEdit }: TableCellProps) {
	const value = record[field.id];
	const displayValue = getFieldDisplayValue(record, field.id, database.schema, database);

	// Non-editable computed fields
	if (field.type === 'formula' || field.type === 'rollup' || field.type === 'createdAt' || field.type === 'lastEditedAt') {
		return <span className="opacity-60">{displayValue}</span>;
	}

	const handleClick = () => onStartEdit();

	switch (field.type) {
		case 'checkbox':
			return (
				<span className="cursor-pointer" onClick={handleClick}>
					{value === true ? '\u2705' : '\u2B1C'}
				</span>
			);
		case 'status':
			return displayValue ? (
				<Badge label={displayValue} color={getStatusColor(displayValue)} onClick={handleClick} />
			) : (
				<span className="cursor-pointer opacity-30" onClick={handleClick}>&mdash;</span>
			);
		case 'select':
			return displayValue ? (
				<Badge label={displayValue} color={getFieldOptionColor(field, displayValue)} onClick={handleClick} />
			) : (
				<span className="cursor-pointer opacity-30" onClick={handleClick}>&mdash;</span>
			);
		case 'multiselect': {
			const values = Array.isArray(value) ? value : [];
			return (
				<div className="flex gap-0.5 flex-wrap cursor-pointer" onClick={handleClick}>
					{values.map((v) => (
						<Badge key={v} label={v} color={getFieldOptionColor(field, v)} />
					))}
					{values.length === 0 && <span className="opacity-30">&mdash;</span>}
				</div>
			);
		}
		case 'relation': {
			const ids = Array.isArray(value) ? value : [];
			return (
				<div className="flex gap-0.5 flex-wrap cursor-pointer" onClick={handleClick}>
					{ids.map((id) => (
						<Badge key={id} label={relationTitles?.[id] ?? id.slice(0, 8)} color="#4b5563" />
					))}
					{ids.length === 0 && <span className="opacity-30">&mdash;</span>}
				</div>
			);
		}
		case 'url':
			return displayValue ? (
				<a
					href={displayValue}
					className="underline"
					style={{ color: 'var(--vscode-textLink-foreground)' }}
					onClick={(e) => e.stopPropagation()}
				>
					{displayValue}
				</a>
			) : (
				<span className="cursor-pointer opacity-30" onClick={handleClick}>&mdash;</span>
			);
		default:
			return (
				<span
					className="cursor-pointer block truncate"
					onClick={handleClick}
					title={displayValue}
				>
					{displayValue || <span className="opacity-30">&mdash;</span>}
				</span>
			);
	}
}
