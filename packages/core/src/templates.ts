/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#database-templates
 * @task: TASK-006
 * @validated: null
 * ---
 */

import type { Database } from './types.js';
import { STATUS_OPTIONS } from './types.js';

export function createDefaultDatabaseTemplate(name: string): Database {
	const titleId = crypto.randomUUID();
	const statusId = crypto.randomUUID();
	return {
		id: crypto.randomUUID(),
		name,
		schema: [
			{ id: titleId, name: 'Title', type: 'text' },
			{ id: statusId, name: 'Status', type: 'status', options: [...STATUS_OPTIONS] },
		],
		views: [
			{
				id: crypto.randomUUID(),
				name: 'All Items',
				type: 'table',
				sort: [],
				filter: [],
				hiddenFields: [],
			},
			{
				id: crypto.randomUUID(),
				name: 'Kanban',
				type: 'kanban',
				groupBy: statusId,
				sort: [],
				filter: [],
				hiddenFields: [],
			},
		],
		records: [],
	};
}

export function createTaskDatabaseTemplate(name: string): Database {
	const titleId = crypto.randomUUID();
	const statusId = crypto.randomUUID();
	const priorityId = crypto.randomUUID();
	const dueDateId = crypto.randomUUID();
	const effortId = crypto.randomUUID();
	const blockedId = crypto.randomUUID();
	const projectsId = crypto.randomUUID();
	return {
		id: crypto.randomUUID(),
		name,
		schema: [
			{ id: titleId, name: 'Title', type: 'text' },
			{ id: statusId, name: 'Status', type: 'status', options: [...STATUS_OPTIONS] },
			{ id: priorityId, name: 'Priority', type: 'select', options: ['Low', 'Medium', 'High'] },
			{ id: dueDateId, name: 'Due Date', type: 'date' },
			{ id: effortId, name: 'Effort', type: 'number' },
			{ id: blockedId, name: 'Blocked', type: 'checkbox' },
			{ id: projectsId, name: 'Project', type: 'relation', relation: {} },
		],
		views: [
			{
				id: crypto.randomUUID(),
				name: 'All Tasks',
				type: 'table',
				sort: [{ fieldId: dueDateId, direction: 'asc' }],
				filter: [],
				hiddenFields: [],
			},
			{
				id: crypto.randomUUID(),
				name: 'By Status',
				type: 'kanban',
				groupBy: statusId,
				sort: [],
				filter: [],
				hiddenFields: [],
			},
			{
				id: crypto.randomUUID(),
				name: 'Calendar',
				type: 'calendar',
				groupBy: dueDateId,
				sort: [],
				filter: [],
				hiddenFields: [],
			},
		],
		records: [],
	};
}

export function isTasksDatabaseName(name: string): boolean {
	return /\btask(s)?\b/i.test(name.trim());
}

export function createDatabase(name: string): Database {
	return isTasksDatabaseName(name)
		? createTaskDatabaseTemplate(name)
		: createDefaultDatabaseTemplate(name);
}
