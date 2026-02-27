import { describe, it, expect } from 'vitest';
import { computeFormulaValue, evaluateFormulaToken } from '../formula.js';
import type { DBRecord, Field } from '../types.js';

function makeFormulaField(expression: string): Field {
	return { id: 'ff', name: 'Formula', type: 'formula', formula: { expression } };
}

const record: DBRecord = { id: 'r1', a: 10, b: 20, c: 'hello' };

describe('computeFormulaValue', () => {
	it('evaluates SUM', () => {
		expect(computeFormulaValue(record, makeFormulaField('SUM({a}, {b})'))).toBe(30);
	});

	it('evaluates AVG', () => {
		expect(computeFormulaValue(record, makeFormulaField('AVG({a}, {b})'))).toBe(15);
	});

	it('evaluates MIN', () => {
		expect(computeFormulaValue(record, makeFormulaField('MIN({a}, {b})'))).toBe(10);
	});

	it('evaluates MAX', () => {
		expect(computeFormulaValue(record, makeFormulaField('MAX({a}, {b})'))).toBe(20);
	});

	it('evaluates UPPER', () => {
		expect(computeFormulaValue(record, makeFormulaField('UPPER({c})'))).toBe('HELLO');
	});

	it('evaluates LOWER', () => {
		expect(computeFormulaValue(record, makeFormulaField('LOWER("WORLD")'))).toBe('world');
	});

	it('evaluates CONCAT', () => {
		expect(computeFormulaValue(record, makeFormulaField('CONCAT({c}, " world")'))).toBe('hello world');
	});

	it('evaluates LEN', () => {
		expect(computeFormulaValue(record, makeFormulaField('LEN({c})'))).toBe(5);
	});

	it('evaluates IF true branch', () => {
		expect(computeFormulaValue(record, makeFormulaField('IF({a}>5, "yes", "no")'))).toBe('yes');
	});

	it('evaluates IF false branch', () => {
		expect(computeFormulaValue(record, makeFormulaField('IF({a}>50, "yes", "no")'))).toBe('no');
	});

	it('evaluates arithmetic expressions', () => {
		expect(computeFormulaValue(record, makeFormulaField('{a} + {b}'))).toBe(30);
	});

	it('evaluates arithmetic with = prefix', () => {
		expect(computeFormulaValue(record, makeFormulaField('= {a} * 2'))).toBe(20);
	});

	it('evaluates bare field ref as arithmetic (non-numeric becomes 0)', () => {
		// {c} = 'hello' → arithmetic evaluator replaces with 0
		expect(computeFormulaValue(record, makeFormulaField('{c}'))).toBe(0);
	});

	it('evaluates string interpolation in concat context', () => {
		expect(computeFormulaValue(record, makeFormulaField('CONCAT({c})'))).toBe('hello');
	});

	it('returns null for empty formula', () => {
		expect(computeFormulaValue(record, makeFormulaField(''))).toBeNull();
	});

	it('evaluates NOW (returns ISO string)', () => {
		const result = computeFormulaValue(record, makeFormulaField('NOW()'));
		expect(typeof result).toBe('string');
		expect((result as string).includes('T')).toBe(true);
	});

	it('evaluates TODAY (returns date string)', () => {
		const result = computeFormulaValue(record, makeFormulaField('TODAY()'));
		expect(typeof result).toBe('string');
		expect((result as string)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
	});

	it('evaluates ABS', () => {
		const r: DBRecord = { id: 'r1', a: -5 };
		expect(computeFormulaValue(r, makeFormulaField('ABS({a})'))).toBe(5);
	});

	it('evaluates ROUND', () => {
		const r: DBRecord = { id: 'r1', a: 3.7 };
		expect(computeFormulaValue(r, makeFormulaField('ROUND({a})'))).toBe(4);
	});
});

describe('evaluateFormulaToken', () => {
	it('parses string literal', () => {
		expect(evaluateFormulaToken('"hello"', record)).toBe('hello');
	});

	it('parses number', () => {
		expect(evaluateFormulaToken('42', record)).toBe(42);
	});

	it('parses field reference', () => {
		expect(evaluateFormulaToken('{a}', record)).toBe(10);
	});

	it('parses boolean', () => {
		expect(evaluateFormulaToken('true', record)).toBe(true);
		expect(evaluateFormulaToken('false', record)).toBe(false);
	});

	it('returns null for empty', () => {
		expect(evaluateFormulaToken('', record)).toBeNull();
	});
});
