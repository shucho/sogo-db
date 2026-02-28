/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/vscode-extension.md#gallery-view
 * @task: TASK-029
 * @validated: null
 * ---
 */

import type { Database, DBRecord, DBView } from 'sogo-db-core';
import { getRecordTitle, getFieldDisplayValue, getVisibleFields } from 'sogo-db-core';
import { postCommand } from '../../hooks/useVSCodeApi.js';
import { EmptyState } from '../shared/EmptyState.js';

interface GalleryViewProps {
	database: Database;
	view: DBView;
	records: DBRecord[];
}

export function GalleryView({ database, view, records }: GalleryViewProps) {
	if (records.length === 0) {
		return (
			<EmptyState
				title="No records"
				description="Create a record to get started."
				action={{ label: '+ New Record', onClick: () => postCommand({ type: 'create-record' }) }}
			/>
		);
	}

	const cardFields = view.cardFields
		? database.schema.filter((f) => view.cardFields!.includes(f.id))
		: getVisibleFields(database.schema, view).slice(1, 4); // skip title, show next 3

	return (
		<div className="grid gap-3 p-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
			{records.map((record) => {
				const title = getRecordTitle(record, database.schema);
				return (
					<div
						key={record.id}
						className="rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow"
						style={{
							backgroundColor: 'var(--vscode-editor-background)',
							border: '1px solid var(--vscode-panel-border)',
						}}
						onClick={() => postCommand({ type: 'open-record', recordId: record.id })}
					>
						<div className="font-medium text-sm mb-2 truncate">{title}</div>
						{cardFields.map((field) => {
							const display = getFieldDisplayValue(record, field.id, database.schema, database);
							if (!display) return null;
							return (
								<div key={field.id} className="flex items-baseline gap-1 text-xs mb-0.5">
									<span className="opacity-40 flex-shrink-0">{field.name}:</span>
									<span className="truncate">{display}</span>
								</div>
							);
						})}
					</div>
				);
			})}
		</div>
	);
}
