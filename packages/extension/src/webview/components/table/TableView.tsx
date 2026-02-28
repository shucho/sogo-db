/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#table-view
 * @task: TASK-024
 * @validated: null
 * ---
 */

import { useMemo, useRef, useState, useCallback } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	type ColumnDef,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Database, DBRecord, DBView, Field } from 'sogo-db-core';
import { getVisibleFields, getFieldDisplayValue } from 'sogo-db-core';
import { postCommand } from '../../hooks/useVSCodeApi.js';
import { TableCell } from './TableCell.js';
import { InlineEditor } from './InlineEditor.js';

interface TableViewProps {
	database: Database;
	view: DBView;
	records: DBRecord[];
	relationTitles: Record<string, string>;
}

export function TableView({ database, view, records, relationTitles }: TableViewProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null);

	const visibleFields = useMemo(
		() => getVisibleFields(database.schema, view),
		[database.schema, view],
	);

	const columns = useMemo<ColumnDef<DBRecord>[]>(
		() =>
			visibleFields.map((field) => ({
				id: field.id,
				header: field.name,
				size: view.columnWidths?.[field.id] ?? 150,
				cell: ({ row }) => {
					const record = row.original;
					if (editingCell?.recordId === record.id && editingCell?.fieldId === field.id) {
						return (
							<InlineEditor
								record={record}
								field={field}
								database={database}
								onSave={(value) => {
									postCommand({
										type: 'update-record',
										recordId: record.id,
										fieldId: field.id,
										value,
									});
									setEditingCell(null);
								}}
								onCancel={() => setEditingCell(null)}
							/>
						);
					}
					return (
						<TableCell
							record={record}
							field={field}
							database={database}
							relationTitles={relationTitles}
							onStartEdit={() => setEditingCell({ recordId: record.id, fieldId: field.id })}
						/>
					);
				},
			})),
		[visibleFields, view.columnWidths, editingCell, database],
	);

	const table = useReactTable({
		data: records,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getRowId: (row) => row.id,
	});

	const { rows } = table.getRowModel();

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 36,
		overscan: 10,
	});

	return (
		<div ref={parentRef} className="overflow-auto flex-1">
			<table className="w-full border-collapse text-xs" style={{ color: 'var(--vscode-foreground)' }}>
				<thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--vscode-editor-background)' }}>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => (
								<th
									key={header.id}
									className="px-2 py-1.5 text-left font-medium border-b whitespace-nowrap"
									style={{
										borderColor: 'var(--vscode-panel-border)',
										width: header.getSize(),
										minWidth: 80,
									}}
								>
									{flexRender(header.column.columnDef.header, header.getContext())}
								</th>
							))}
						</tr>
					))}
				</thead>
				<tbody>
					{virtualizer.getVirtualItems().length > 0 && (
						<tr style={{ height: virtualizer.getVirtualItems()[0].start }} >
							<td />
						</tr>
					)}
					{virtualizer.getVirtualItems().map((virtualRow) => {
						const row = rows[virtualRow.index];
						return (
							<tr
								key={row.id}
								className="hover:opacity-90"
								style={{ height: 36 }}
							>
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										className="px-2 py-1 border-b"
										style={{ borderColor: 'var(--vscode-panel-border)' }}
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						);
					})}
					{virtualizer.getVirtualItems().length > 0 && (
						<tr
							style={{
								height:
									virtualizer.getTotalSize() -
									(virtualizer.getVirtualItems().at(-1)?.end ?? 0),
							}}
						>
							<td />
						</tr>
					)}
				</tbody>
			</table>
		</div>
	);
}
