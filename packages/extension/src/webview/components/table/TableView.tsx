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
	onOpenRecord: (recordId: string) => void;
}

export function TableView({ database, view, records, relationTitles, onOpenRecord }: TableViewProps) {
	const parentRef = useRef<HTMLDivElement>(null);
	const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null);

	const visibleFields = useMemo(
		() => getVisibleFields(database.schema, view),
		[database.schema, view],
	);

	const columns = useMemo<ColumnDef<DBRecord>[]>(
		() => [
			{
				id: '__expand',
				header: '',
				size: 28,
				cell: ({ row }) => (
					<button
						className="flex items-center justify-center w-[28px] h-full opacity-0 group-hover/row:opacity-30 hover:!opacity-80 transition-opacity"
						onClick={() => onOpenRecord(row.original.id)}
						title="Open record"
					>
						<svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
							<path d="M1.5 1h4l1 1H1.5v11h11V8.5l1-1V14H.5V1h1zm7 0L14 1v5.5l-1-1V2.707L7.354 8.354l-.708-.708L12.293 2H9.5l-1-1z" />
						</svg>
					</button>
				),
			},
			...visibleFields.map((field) => ({
				id: field.id,
				header: field.name,
				size: view.columnWidths?.[field.id] ?? 150,
				cell: ({ row }: { row: { original: DBRecord } }) => {
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
		],
		[visibleFields, view.columnWidths, editingCell, database, onOpenRecord],
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
			<table className="w-full border-collapse" style={{ fontSize: '13px', color: 'var(--vscode-foreground)' }}>
				<thead className="sticky top-0 z-10" style={{ backgroundColor: 'var(--vscode-editor-background)' }}>
					{table.getHeaderGroups().map((headerGroup) => (
						<tr key={headerGroup.id}>
							{headerGroup.headers.map((header) => {
								const isExpand = header.id === '__expand';
								return (
									<th
										key={header.id}
										className="text-left font-medium border-b whitespace-nowrap"
										style={{
											borderColor: 'var(--vscode-panel-border)',
											width: header.getSize(),
											minWidth: isExpand ? undefined : 80,
											padding: isExpand ? '0' : '6px 10px',
											fontSize: '12px',
											opacity: 0.7,
										}}
									>
										{flexRender(header.column.columnDef.header, header.getContext())}
									</th>
								);
							})}
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
								className="group/row table-row-hover"
								style={{ height: 36 }}
							>
								{row.getVisibleCells().map((cell) => {
									const isExpand = cell.column.id === '__expand';
									return (
										<td
											key={cell.id}
											className="border-b"
											style={{
												borderColor: 'var(--vscode-panel-border)',
												padding: isExpand ? '0' : '4px 10px',
												width: isExpand ? '28px' : undefined,
											}}
										>
											{flexRender(cell.column.columnDef.cell, cell.getContext())}
										</td>
									);
								})}
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
