/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#csv-importexport
 * @task: TASK-006
 * @validated: null
 * ---
 */

import type { Database, DBRecord, Field } from './types.js';

export function exportCsv(db: Database): string {
	const { schema } = db;
	const headers = ['id', ...schema.map(f => f.name)];
	const rows: string[] = [headers.map(csvEscape).join(',')];
	for (const record of db.records) {
		const cells = [
			csvEscape(record.id),
			...schema.map(f => {
				const val = record[f.id];
				if (val === null || val === undefined) return '';
				if (Array.isArray(val)) return csvEscape(val.join(';'));
				return csvEscape(String(val));
			}),
		];
		rows.push(cells.join(','));
	}
	return rows.join('\r\n');
}

export function importCsvRecords(
	db: Database,
	csvText: string,
	fieldMap: Record<string, string>,
): DBRecord[] {
	const lines = csvText.split(/\r?\n/).filter(l => l.trim());
	if (lines.length < 2) return [];
	const headers = parseCsvRow(lines[0]);
	const records: DBRecord[] = [];
	for (let i = 1; i < lines.length; i++) {
		const cells = parseCsvRow(lines[i]);
		const record: DBRecord = { id: crypto.randomUUID() };
		for (let j = 0; j < headers.length; j++) {
			const csvHeader = headers[j];
			const fieldId = fieldMap[csvHeader];
			if (!fieldId) continue;
			const field = db.schema.find(f => f.id === fieldId);
			if (!field) continue;
			const raw = cells[j] ?? '';
			record[fieldId] = coerceCsvValue(field, raw);
		}
		records.push(record);
	}
	return records;
}

function coerceCsvValue(field: Field, raw: string): string | number | boolean | string[] | null {
	if (field.type === 'number') {
		return raw === '' ? null : Number(raw);
	}
	if (field.type === 'checkbox') {
		return raw.toLowerCase() === 'true' || raw === '1';
	}
	if (field.type === 'multiselect') {
		return raw ? raw.split(';').map(s => s.trim()) : [];
	}
	return raw || null;
}

function csvEscape(val: string): string {
	if (val.includes(',') || val.includes('"') || val.includes('\n')) {
		return `"${val.replace(/"/g, '""')}"`;
	}
	return val;
}

function parseCsvRow(line: string): string[] {
	const cells: string[] = [];
	let cur = '';
	let inQuotes = false;
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
			else { inQuotes = !inQuotes; }
		} else if (ch === ',' && !inQuotes) {
			cells.push(cur); cur = '';
		} else {
			cur += ch;
		}
	}
	cells.push(cur);
	return cells;
}
