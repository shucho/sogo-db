/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#kanban-view
 * @task: TASK-027
 * @validated: null
 * ---
 */

import { useDraggable } from '@dnd-kit/core';
import type { Database, DBRecord } from 'sogo-db-core';
import { getRecordTitle } from 'sogo-db-core';


interface KanbanCardProps {
	record: DBRecord;
	database: Database;
	onOpenRecord: (recordId: string) => void;
}

export function KanbanCard({ record, database, onOpenRecord }: KanbanCardProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
		id: record.id,
	});

	const title = getRecordTitle(record, database.schema);

	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
				opacity: isDragging ? 0.5 : 1,
			}
		: undefined;

	return (
		<div
			ref={setNodeRef}
			{...listeners}
			{...attributes}
			className="rounded px-3 py-2 text-xs cursor-grab active:cursor-grabbing shadow-sm hover:shadow"
			style={{
				backgroundColor: 'var(--vscode-editor-background)',
				border: '1px solid var(--vscode-panel-border)',
				...style,
			}}
			onClick={() => onOpenRecord(record.id)}
		>
			{title}
		</div>
	);
}
