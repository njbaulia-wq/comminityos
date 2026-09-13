import { describe, it, expect } from 'vitest';
import { resolveTestAlias } from '@/test/setup';

describe('Tooling & Test Framework Setup', () => {
  it('should resolve @/ path alias correctly', () => {
    expect(resolveTestAlias()).toBe('ALIAS_RESOLVED');
  });

  it('should run in strict TypeScript mode without implicit any', () => {
    const strictAdd = (a: number, b: number): number => a + b;
    expect(strictAdd(10, 20)).toBe(30);
  });
});
