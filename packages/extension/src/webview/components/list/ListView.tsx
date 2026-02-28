/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#list-view
 * @task: TASK-030
 * @validated: null
 * ---
 */

import type { Database, DBRecord, DBView } from 'sogo-db-core';
import { getRecordTitle, getFieldDisplayValue, getVisibleFields } from 'sogo-db-core';
import { postCommand } from '../../hooks/useVSCodeApi.js';
import { EmptyState } from '../shared/EmptyState.js';

interface ListViewProps {
	database: Database;
	view: DBView;
	records: DBRecord[];
}

export function ListView({ database, view, records }: ListViewProps) {
	if (records.length === 0) {
		return (
			<EmptyState
				title="No records"
				description="Create a record to get started."
				action={{ label: '+ New Record', onClick: () => postCommand({ type: 'create-record' }) }}
			/>
		);
	}

	const summaryFields = getVisibleFields(database.schema, view).slice(1, 3);

	return (
		<div className="flex flex-col flex-1 overflow-y-auto">
			{records.map((record) => {
				const title = getRecordTitle(record, database.schema);
				return (
					<div
						key={record.id}
						className="flex items-center gap-3 px-4 py-2 border-b cursor-pointer hover:opacity-80"
						style={{ borderColor: 'var(--vscode-panel-border)' }}
						onClick={() => postCommand({ type: 'open-record', recordId: record.id })}
					>
						<span className="font-medium text-sm flex-1 truncate">{title}</span>
						{summaryFields.map((field) => {
							const display = getFieldDisplayValue(record, field.id, database.schema, database);
							return (
								<span key={field.id} className="text-xs opacity-60 truncate max-w-[120px]">
									{display || '—'}
								</span>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
