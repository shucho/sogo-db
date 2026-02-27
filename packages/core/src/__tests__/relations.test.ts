import { describe, it, expect } from 'vitest';
import { getRelationTargetDatabase, inferImplicitRelationTargets } from '../relations.js';
import type { Database, Field } from '../types.js';

describe('getRelationTargetDatabase', () => {
	it('returns target via resolver', () => {
		const target: Database = { id: 'target', name: 'Target', schema: [], views: [], records: [] };
		const source: Database = { id: 'source', name: 'Source', schema: [], views: [], records: [] };
		const field: Field = { id: 'f1', name: 'Ref', type: 'relation', relation: { targetDatabaseId: 'target' } };
		expect(getRelationTargetDatabase(source, field, id => id === 'target' ? target : undefined)).toBe(target);
	});

	it('returns source DB when no resolver', () => {
		const source: Database = { id: 'source', name: 'Source', schema: [], views: [], records: [] };
		const field: Field = { id: 'f1', name: 'Ref', type: 'relation', relation: { targetDatabaseId: 'target' } };
		expect(getRelationTargetDatabase(source, field)).toBe(source);
	});
});

describe('inferImplicitRelationTargets', () => {
	it('infers target by name match', () => {
		const projects: Database = { id: 'p1', name: 'Projects', schema: [], views: [], records: [] };
		const tasks: Database = {
			id: 't1', name: 'Tasks',
			schema: [{ id: 'f1', name: 'Project', type: 'relation' }],
			views: [], records: [],
		};
		const changed = inferImplicitRelationTargets(tasks, [projects, tasks]);
		expect(changed).toBe(true);
		expect(tasks.schema[0].relation?.targetDatabaseId).toBe('p1');
	});

	it('skips already configured relations', () => {
		const projects: Database = { id: 'p1', name: 'Projects', schema: [], views: [], records: [] };
		const tasks: Database = {
			id: 't1', name: 'Tasks',
			schema: [{ id: 'f1', name: 'Project', type: 'relation', relation: { targetDatabaseId: 'existing' } }],
			views: [], records: [],
		};
		const changed = inferImplicitRelationTargets(tasks, [projects, tasks]);
		expect(changed).toBe(false);
		expect(tasks.schema[0].relation?.targetDatabaseId).toBe('existing');
	});

	it('infers backlink field', () => {
		const projects: Database = {
			id: 'p1', name: 'Projects',
			schema: [{ id: 'pf1', name: 'Tasks', type: 'relation' }],
			views: [], records: [],
		};
		const tasks: Database = {
			id: 't1', name: 'Tasks',
			schema: [{ id: 'tf1', name: 'Project', type: 'relation' }],
			views: [], records: [],
		};
		inferImplicitRelationTargets(tasks, [projects, tasks]);
		expect(tasks.schema[0].relation?.targetRelationFieldId).toBe('pf1');
	});
});
