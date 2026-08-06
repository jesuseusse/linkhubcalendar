import { describe, it, expect } from 'vitest';
import { normalizeEmail } from './normalizeEmail';

describe('normalizeEmail', () => {
	it('lowercases mixed-case emails', () => {
		expect(normalizeEmail('Jesuseusse@gmail.com')).toBe('jesuseusse@gmail.com');
	});

	it('trims surrounding whitespace', () => {
		expect(normalizeEmail('  user@example.com  ')).toBe('user@example.com');
	});

	it('returns an empty string for null/undefined', () => {
		expect(normalizeEmail(null)).toBe('');
		expect(normalizeEmail(undefined)).toBe('');
	});

	it('is idempotent for an already-normalized email', () => {
		expect(normalizeEmail('user@example.com')).toBe('user@example.com');
	});
});
