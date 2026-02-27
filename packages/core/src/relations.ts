/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#relation-utilities
 * @task: TASK-005
 * @validated: null
 * ---
 */

import type { Database, DatabaseResolver, Field } from './types.js';

export function getRelationTargetDatabase(
	db: Database,
	relationField: Field,
	resolveDatabase?: DatabaseResolver,
): Database {
	const targetDatabaseId = relationField.relation?.targetDatabaseId;
	if (targetDatabaseId && resolveDatabase) {
		return resolveDatabase(targetDatabaseId) ?? db;
	}
	return db;
}

export function inferImplicitRelationTargets(db: Database, databases: Iterable<Database>): boolean {
	const peers = [...databases].filter(candidate => candidate.id !== db.id);
	let changed = false;

	for (const field of db.schema) {
		if (field.type !== 'relation') continue;
		field.relation ??= {};
		if (field.relation.targetDatabaseId) continue;

		const inferred = inferTargetDatabase(field.name, db.name, peers);
		if (!inferred) continue;

		field.relation.targetDatabaseId = inferred.id;
		changed = true;

		if (!field.relation.targetRelationFieldId) {
			const backlink = inferBacklinkField(inferred, db.name);
			if (backlink) field.relation.targetRelationFieldId = backlink.id;
		}
	}

	return changed;
}

function inferTargetDatabase(
	relationFieldName: string,
	sourceDbName: string,
	peers: Database[],
): Database | undefined {
	const relationToken = normalizeToken(relationFieldName);
	const sourceToken = normalizeToken(sourceDbName);
	const candidates = [
		...peers.filter(p => normalizeToken(p.name) === relationToken),
		...peers.filter(p => normalizeToken(p.name).includes(relationToken)),
		...peers.filter(p => relationToken.includes(normalizeToken(p.name))),
	];
	if (candidates.length) return candidates[0];

	if (relationToken.includes('project')) {
		return peers.find(p => normalizeToken(p.name).includes('project'));
	}
	if (sourceToken.includes('task') && relationToken.includes('project')) {
		return peers.find(p => normalizeToken(p.name).includes('project'));
	}
	if (sourceToken.includes('project') && relationToken.includes('task')) {
		return peers.find(p => normalizeToken(p.name).includes('task'));
	}
	return undefined;
}

function inferBacklinkField(targetDb: Database, sourceDbName: string): Field | undefined {
	const sourceToken = normalizeToken(sourceDbName);
	return targetDb.schema.find(
		field => field.type === 'relation' && normalizeToken(field.name).includes(sourceToken),
	);
}

function normalizeToken(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');
}
