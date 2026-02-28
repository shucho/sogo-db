/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#kanban-view
 * @task: TASK-027
 * @validated: null
 * ---
 */

import { useMemo } from 'react';
import {
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import type { Database, DBRecord, DBView, Field } from 'sogo-db-core';
import { STATUS_OPTIONS } from 'sogo-db-core';
import { postCommand } from '../../hooks/useVSCodeApi.js';
import { KanbanColumn } from './KanbanColumn.js';
import { EmptyState } from '../shared/EmptyState.js';

interface KanbanViewProps {
	database: Database;
	view: DBView;
	records: DBRecord[];
	relationTitles?: Record<string, string>;
	onOpenRecord: (recordId: string) => void;
}

export function KanbanView({ database, view, records, onOpenRecord }: KanbanViewProps) {
	const groupField = useMemo(
		() => database.schema.find((f) => f.id === view.groupBy),
		[database.schema, view.groupBy],
	);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
	);

	const columns = useMemo(() => {
		if (!groupField) return [];

		const options =
			groupField.type === 'status'
				? [...STATUS_OPTIONS]
				: groupField.options ?? [];

		// Add "No value" column
		const cols = [
			{ value: '', label: 'No value', records: [] as DBRecord[] },
			...options.map((opt) => ({ value: opt, label: opt, records: [] as DBRecord[] })),
		];

		for (const record of records) {
			const val = String(record[groupField.id] ?? '');
			const col = cols.find((c) => c.value === val) ?? cols[0];
			col.records.push(record);
		}

		return cols;
	}, [groupField, records]);

	if (!groupField) {
		return (
			<EmptyState
				title="No group field"
				description="Kanban view requires a status or select field to group by."
			/>
		);
	}

	function handleDragEnd(event: DragEndEvent) {
		const { active, over } = event;
		if (!over || !groupField) return;

		const recordId = String(active.id);
		const newValue = String(over.id);

		postCommand({
			type: 'move-record',
			recordId,
			fieldId: groupField.id,
			value: newValue,
		});
	}

	return (
		<DndContext sensors={sensors} onDragEnd={handleDragEnd}>
			<div className="flex gap-3 p-3 overflow-x-auto flex-1">
				{columns.map((col) => (
					<KanbanColumn
						key={col.value}
						columnValue={col.value}
						label={col.label}
						records={col.records}
						groupField={groupField}
						database={database}
						onOpenRecord={onOpenRecord}
					/>
				))}
			</div>
		</DndContext>
	);
}
