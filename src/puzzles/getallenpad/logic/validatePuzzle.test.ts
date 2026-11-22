import { describe, expect, it, vi } from 'vitest';

import { TEST_PUZZLE, testPuzzle } from './testPuzzle';
import type { GetallenpadPuzzle } from './types';
import { isGetallenpadPuzzle, type ValidationCode, validatePuzzle } from './validatePuzzle';

const codes = (puzzle: GetallenpadPuzzle, ...args: Parameters<typeof validatePuzzle>[1][]) => {
  const result = validatePuzzle(puzzle, ...args);
  return result.ok ? [] : result.error.map((e) => e.code);
};

describe('validatePuzzle', () => {
  it('accepts a valid puzzle', () => {
    expect(validatePuzzle(TEST_PUZZLE)).toEqual({ ok: true, value: TEST_PUZZLE });
  });

  it('rejects rows that do not match the size', () => {
    const puzzle = testPuzzle();
    puzzle.givens[2]!.pop();
    expect(codes(puzzle)).toEqual<ValidationCode[]>(['dimensions']);
    const tall = testPuzzle();
    tall.solution.push([17, 18, 19, 20]);
    expect(codes(tall)).toEqual<ValidationCode[]>(['dimensions']);
  });

  it('rejects a solution that is not 1..N once each', () => {
    const duplicate = testPuzzle();
    duplicate.solution[2]![3] = 11;
    expect(codes(duplicate)).toContain('solution-values');
    const outOfRange = testPuzzle();
    outOfRange.solution[2]![3] = 17;
    expect(codes(outOfRange)).toContain('solution-values');
  });

  it('rejects consecutive values that do not touch', () => {
    const puzzle = testPuzzle();
    // Swap 5 and 8 in the second row: the path now jumps across the row.
    puzzle.solution[1] = [5, 7, 6, 8];
    puzzle.givens[1] = [null, 7, null, null];
    const result = validatePuzzle(puzzle);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.filter((e) => e.code === 'not-adjacent').map((e) => e.message)).toEqual([
        '4 en 5 liggen niet naast elkaar.',
        '5 en 6 liggen niet naast elkaar.',
        '7 en 8 liggen niet naast elkaar.',
        '8 en 9 liggen niet naast elkaar.',
      ]);
    }
  });

  it('rejects a given that differs from the solution', () => {
    const puzzle = testPuzzle();
    puzzle.givens[1]![2] = 5;
    expect(codes(puzzle)).toEqual<ValidationCode[]>(['given-mismatch']);
  });

  it('requires 1 and N to be given', () => {
    const puzzle = testPuzzle();
    puzzle.givens[3]![0] = null;
    puzzle.metric.givenRatio = 8 / 16;
    const result = validatePuzzle(puzzle);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toEqual([
        { code: 'missing-endpoint', message: 'Het getal 16 moet gegeven zijn.' },
      ]);
    }
  });

  it('rejects a stored ratio that does not match the givens', () => {
    const puzzle = testPuzzle();
    puzzle.metric.givenRatio = 0.5;
    expect(codes(puzzle)).toEqual<ValidationCode[]>(['metric']);
    puzzle.metric.givenRatio = 0.565; // within tolerance of 0.5625
    expect(codes(puzzle)).toEqual([]);
  });

  it('checks uniqueness only when a solution counter is given', () => {
    expect(codes(TEST_PUZZLE, { countSolutions: () => 1 })).toEqual([]);
    expect(codes(TEST_PUZZLE, { countSolutions: () => 0 })).toEqual<ValidationCode[]>([
      'no-solution',
    ]);
    expect(codes(TEST_PUZZLE, { countSolutions: () => 'many' })).toEqual<ValidationCode[]>([
      'not-unique',
    ]);
  });

  it('does not count solutions of a broken puzzle', () => {
    const puzzle = testPuzzle();
    puzzle.givens[1]![2] = 5;
    const countSolutions = vi.fn(() => 1 as const);
    expect(codes(puzzle, { countSolutions })).toEqual<ValidationCode[]>(['given-mismatch']);
    expect(countSolutions).not.toHaveBeenCalled();
  });
});

describe('isGetallenpadPuzzle', () => {
  it('accepts the shape of a puzzle (also after a JSON round trip)', () => {
    expect(isGetallenpadPuzzle(TEST_PUZZLE)).toBe(true);
    expect(isGetallenpadPuzzle(JSON.parse(JSON.stringify({ ...TEST_PUZZLE, seed: 42 })))).toBe(
      true,
    );
  });

  it.each<[string, (p: Record<string, unknown>) => void]>([
    ['a wrong version', (p) => (p.version = 2)],
    ['an id with capitals', (p) => (p.id = 'Slang')],
    ['an unknown level', (p) => (p.level = 'extreem')],
    ['a grid that is too big', (p) => (p.width = 11)],
    ['a grid that is too small', (p) => (p.height = 2)],
    ['text in the solution', (p) => (p.solution = [['1']])],
    ['a fraction in the givens', (p) => (p.givens = [[1.5]])],
    ['a missing metric', (p) => delete p.metric],
    ['a ratio above 1', (p) => (p.metric = { givenRatio: 1.5, solverNodes: 0 })],
    ['a negative node count', (p) => (p.metric = { givenRatio: 0.3, solverNodes: -1 })],
    ['a text seed', (p) => (p.seed = '42')],
  ])('rejects %s', (_, change) => {
    const puzzle: Record<string, unknown> = structuredClone({ ...TEST_PUZZLE });
    change(puzzle);
    expect(isGetallenpadPuzzle(puzzle)).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(isGetallenpadPuzzle(null)).toBe(false);
    expect(isGetallenpadPuzzle('puzzel')).toBe(false);
  });
});
