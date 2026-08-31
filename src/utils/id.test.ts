import { describe, it, expect } from 'vitest';
import { generateId } from './id';

describe('generateId', () => {
  it('prefixes the generated id as requested', () => {
    const id = generateId('violation');
    expect(id.startsWith('violation-')).toBe(true);
  });

  it('produces unique ids across repeated calls', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateId('test')));
    expect(ids.size).toBe(50);
  });
});
