import { describe, it, expect } from 'vitest';
import { createDefaultDatabaseTemplate, createTaskDatabaseTemplate, isTasksDatabaseName, createDatabase } from '../templates.js';

describe('createDefaultDatabaseTemplate', () => {
	it('creates database with Title and Status fields', () => {
		const db = createDefaultDatabaseTemplate('My DB');
		expect(db.name).toBe('My DB');
		expect(db.schema).toHaveLength(2);
		expect(db.schema[0].name).toBe('Title');
		expect(db.schema[0].type).toBe('text');
		expect(db.schema[1].name).toBe('Status');
		expect(db.schema[1].type).toBe('status');
	});

	it('creates table and kanban views', () => {
		const db = createDefaultDatabaseTemplate('Test');
		expect(db.views).toHaveLength(2);
		expect(db.views[0].type).toBe('table');
		expect(db.views[1].type).toBe('kanban');
		expect(db.views[1].groupBy).toBe(db.schema[1].id);
	});

	it('has unique IDs', () => {
		const db = createDefaultDatabaseTemplate('Test');
		const ids = [db.id, ...db.schema.map(f => f.id), ...db.views.map(v => v.id)];
		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe('createTaskDatabaseTemplate', () => {
	it('creates database with task-specific fields', () => {
		const db = createTaskDatabaseTemplate('Tasks');
		expect(db.schema).toHaveLength(7);
		const names = db.schema.map(f => f.name);
		expect(names).toContain('Priority');
		expect(names).toContain('Due Date');
		expect(names).toContain('Effort');
		expect(names).toContain('Blocked');
		expect(names).toContain('Project');
	});

	it('creates table, kanban, and calendar views', () => {
		const db = createTaskDatabaseTemplate('Tasks');
		expect(db.views).toHaveLength(3);
		expect(db.views.map(v => v.type)).toEqual(['table', 'kanban', 'calendar']);
	});
});

describe('isTasksDatabaseName', () => {
	it('matches task names', () => {
		expect(isTasksDatabaseName('Tasks')).toBe(true);
		expect(isTasksDatabaseName('My Tasks')).toBe(true);
		expect(isTasksDatabaseName('task')).toBe(true);
	});

	it('rejects non-task names', () => {
		expect(isTasksDatabaseName('Projects')).toBe(false);
		expect(isTasksDatabaseName('Tasking')).toBe(false);
	});
});

describe('createDatabase', () => {
	it('uses task template for task names', () => {
		const db = createDatabase('Tasks');
		expect(db.schema.length).toBeGreaterThan(2);
	});

	it('uses default template for other names', () => {
		const db = createDatabase('Projects');
		expect(db.schema).toHaveLength(2);
	});
});
