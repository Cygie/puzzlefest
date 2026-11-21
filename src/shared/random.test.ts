import { describe, expect, it } from 'vitest';

import { createRng, randomInt, shuffle } from './random';

describe('createRng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    const seqA = Array.from({ length: 5 }, () => a());
    const seqB = Array.from({ length: 5 }, () => b());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it('stays within [0, 1)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe('randomInt', () => {
  it('returns integers below the maximum', () => {
    const rng = createRng(3);
    for (let i = 0; i < 200; i++) {
      const n = randomInt(rng, 5);
      expect(Number.isInteger(n)).toBe(true);
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(5);
    }
  });
});

describe('shuffle', () => {
  it('returns a permutation without changing the input', () => {
    const input = [1, 2, 3, 4, 5, 6];
    const result = shuffle(input, createRng(9));
    expect(input).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...result].sort()).toEqual(input);
  });

  it('is deterministic for a given seed', () => {
    expect(shuffle(['a', 'b', 'c', 'd'], createRng(5))).toEqual(
      shuffle(['a', 'b', 'c', 'd'], createRng(5)),
    );
  });
});
