/**
 * ---
 * @anchor: .patterns/core-module
 * @spec: specs/core-library.md#formula-engine
 * @task: TASK-004
 * @validated: null
 * ---
 */

import type { DBRecord, Field } from './types.js';

export function computeFormulaValue(record: DBRecord, field: Field): string | number | null {
	let expression = field.formula?.expression?.trim();
	if (!expression) return null;
	if (expression.startsWith('=')) expression = expression.slice(1).trim();

	const functionMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/.exec(expression);
	if (functionMatch) {
		const fnName = functionMatch[1].toUpperCase();
		const args = splitFormulaArgs(functionMatch[2]).map(arg => evaluateFormulaToken(arg, record));
		return applyFormulaFunction(fnName, args, record);
	}

	const arithmetic = tryEvaluateArithmetic(expression, record);
	if (arithmetic !== null && arithmetic !== undefined) return arithmetic;

	const replaced = expression.replace(/\{([^}]+)\}/g, (_full, fieldId) => {
		const value = record[String(fieldId).trim()];
		if (value === null || value === undefined) return '';
		if (Array.isArray(value)) return value.join(', ');
		return String(value);
	});
	const asNumber = Number(replaced);
	return Number.isFinite(asNumber) && replaced !== '' ? asNumber : replaced;
}

function splitFormulaArgs(args: string): string[] {
	const out: string[] = [];
	let current = '';
	let depth = 0;
	let quote: '"' | '\'' | null = null;
	for (let i = 0; i < args.length; i++) {
		const ch = args[i];
		if ((ch === '"' || ch === '\'') && (!quote || quote === ch)) {
			quote = quote ? null : (ch as '"' | '\'');
			current += ch;
			continue;
		}
		if (!quote) {
			if (ch === '(') { depth++; current += ch; continue; }
			if (ch === ')') { depth = Math.max(0, depth - 1); current += ch; continue; }
			if (ch === ',' && depth === 0) {
				out.push(current.trim());
				current = '';
				continue;
			}
		}
		current += ch;
	}
	if (current.trim()) out.push(current.trim());
	return out;
}

export function evaluateFormulaToken(token: string, record: DBRecord): string | number | boolean | null {
	const t = token.trim();
	if (!t.length) return null;
	if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith('\'') && t.endsWith('\''))) {
		return t.slice(1, -1);
	}
	const num = Number(t);
	if (Number.isFinite(num) && !/[a-zA-Z{}]/.test(t)) return num;
	const fieldRef = /^\{([^}]+)\}$/.exec(t);
	if (fieldRef) {
		const value = record[fieldRef[1].trim()];
		if (Array.isArray(value)) return value.join(', ');
		if (value === null || value === undefined) return null;
		return value as string | number | boolean;
	}
	const bool = t.toLowerCase();
	if (bool === 'true') return true;
	if (bool === 'false') return false;
	return t;
}

function applyFormulaFunction(
	name: string,
	args: Array<string | number | boolean | null>,
	record: DBRecord,
): string | number | null {
	switch (name) {
		case 'SUM':
			return numericArgs(args).reduce((sum, v) => sum + v, 0);
		case 'AVG': {
			const nums = numericArgs(args);
			return nums.length ? nums.reduce((sum, v) => sum + v, 0) / nums.length : 0;
		}
		case 'MIN': {
			const nums = numericArgs(args);
			return nums.length ? Math.min(...nums) : 0;
		}
		case 'MAX': {
			const nums = numericArgs(args);
			return nums.length ? Math.max(...nums) : 0;
		}
		case 'ABS': return Math.abs(Number(args[0] ?? 0));
		case 'ROUND': return Math.round(Number(args[0] ?? 0));
		case 'LEN': return String(args[0] ?? '').length;
		case 'UPPER': return String(args[0] ?? '').toUpperCase();
		case 'LOWER': return String(args[0] ?? '').toLowerCase();
		case 'CONCAT': return args.map(v => v === null || v === undefined ? '' : String(v)).join('');
		case 'NOW': return new Date().toISOString();
		case 'TODAY': return new Date().toISOString().slice(0, 10);
		case 'IF': {
			const condition = evaluateFormulaCondition(args[0], record);
			return condition
				? (args[1] === null || args[1] === undefined ? '' : (args[1] as string | number))
				: (args[2] === null || args[2] === undefined ? '' : (args[2] as string | number));
		}
		default:
			return args[0] === null || args[0] === undefined ? null : String(args[0]);
	}
}

function evaluateFormulaCondition(raw: string | number | boolean | null, record: DBRecord): boolean {
	if (typeof raw === 'boolean') return raw;
	if (typeof raw === 'number') return raw !== 0;
	if (raw === null || raw === undefined) return false;
	const condition = String(raw).trim();
	const match = /(.+?)(>=|<=|!=|=|>|<)(.+)/.exec(condition);
	if (!match) return Boolean(condition);
	const left = evaluateFormulaToken(match[1].trim(), record);
	const right = evaluateFormulaToken(match[3].trim(), record);
	const op = match[2];
	if (typeof left === 'number' || typeof right === 'number') {
		const ln = Number(left ?? 0);
		const rn = Number(right ?? 0);
		switch (op) {
			case '>': return ln > rn;
			case '<': return ln < rn;
			case '>=': return ln >= rn;
			case '<=': return ln <= rn;
			case '=': return ln === rn;
			case '!=': return ln !== rn;
			default: return false;
		}
	}
	const ls = String(left ?? '');
	const rs = String(right ?? '');
	switch (op) {
		case '=': return ls === rs;
		case '!=': return ls !== rs;
		case '>': return ls > rs;
		case '<': return ls < rs;
		case '>=': return ls >= rs;
		case '<=': return ls <= rs;
		default: return false;
	}
}

function numericArgs(args: Array<string | number | boolean | null>): number[] {
	return args.map(v => Number(v)).filter(v => Number.isFinite(v));
}

function tryEvaluateArithmetic(expression: string, record: DBRecord): number | null {
	const replaced = expression.replace(/\{([^}]+)\}/g, (_full, fieldId) => {
		const value = Number(record[String(fieldId).trim()]);
		return Number.isFinite(value) ? String(value) : '0';
	});
	if (!/^[0-9+\-*/().\s%]+$/.test(replaced)) return null;
	try {
		const value = Function(`"use strict"; return (${replaced});`)();
		return Number.isFinite(value) ? Number(value) : null;
	} catch {
		return null;
	}
}
