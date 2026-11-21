import { describe, expect, it } from 'vitest';

import { testPuzzle } from './testPuzzle';
import type { SlangWord, WoordslangPuzzle } from './types';
import {
  findCrossings,
  isWoordslangPuzzle,
  spansGrid,
  validatePuzzle,
  type ValidationCode,
} from './validatePuzzle';

const p = (...cells: [number, number][]) => cells.map(([row, col]) => ({ row, col }));

/** Distinct error codes of a puzzle (empty when valid). */
function codes(puzzle: WoordslangPuzzle): ValidationCode[] {
  const result = validatePuzzle(puzzle);
  return result.ok ? [] : [...new Set(result.error.map((e) => e.code))].sort();
}

/** Test puzzle with one word replaced. */
function withWord(letters: string, change: (word: SlangWord) => SlangWord | null) {
  const puzzle = testPuzzle();
  puzzle.words = puzzle.words.flatMap((w) => {
    if (w.letters !== letters) return [w];
    const next = change(w);
    return next ? [next] : [];
  });
  return puzzle;
}

describe('validatePuzzle', () => {
  it('accepts a valid puzzle (IJ in VIJG takes two cells)', () => {
    const puzzle = testPuzzle();
    expect(validatePuzzle(puzzle)).toEqual({ ok: true, value: puzzle });
  });

  it('reports the total letter count when a word is missing', () => {
    const result = codes(withWord('KERS', () => null));
    expect(result).toEqual(['letter-count', 'uncovered']);
  });

  it('reports a path that is shorter than the word', () => {
    const puzzle = withWord('KERS', (w) => ({ ...w, path: w.path.slice(0, 3) }));
    expect(codes(puzzle)).toEqual(['path-length', 'uncovered']);
  });

  it('reports a path outside the grid', () => {
    const puzzle = withWord('VIJG', (w) => ({ ...w, path: p([6, 4], [6, 5], [7, 5], [8, 4]) }));
    expect(codes(puzzle)).toEqual(['out-of-bounds', 'uncovered']);
  });

  it('reports letters that do not touch', () => {
    const puzzle = withWord('KERS', (w) => ({ ...w, path: p([7, 3], [7, 2], [7, 0], [7, 1]) }));
    puzzle.grid[7] = 'RSEKGJ';
    const result = validatePuzzle(puzzle);
    expect(codes(puzzle)).toEqual(['not-adjacent']);
    if (!result.ok)
      expect(result.error[0]?.message).toBe('In "kers" liggen letter 2 en 3 niet naast elkaar.');
  });

  it('reports a cell used twice within a word', () => {
    const puzzle = withWord('KERS', (w) => ({ ...w, path: p([7, 3], [7, 2], [7, 1], [7, 2]) }));
    expect(codes(puzzle)).toContain('repeated-cell');
  });

  it('reports overlapping words', () => {
    const puzzle = withWord('KIWI', (w) => ({ ...w, path: p([6, 0], [6, 1], [6, 2], [6, 4]) }));
    expect(codes(puzzle)).toEqual(expect.arrayContaining(['overlap', 'uncovered', 'not-adjacent']));
  });

  it('reports grid letters that do not match the words', () => {
    const puzzle = testPuzzle();
    puzzle.grid[0] = 'XRUITM';
    expect(codes(puzzle)).toEqual(['letter-mismatch']);
  });

  it('requires exactly one key word', () => {
    expect(codes(withWord('FRUITMAND', (w) => ({ ...w, key: false })))).toEqual(['key-word']);
    expect(codes(withWord('PEER', (w) => ({ ...w, key: true })))).toEqual([
      'key-edges',
      'key-word',
    ]);
  });

  it('requires the key word to touch two opposite edges', () => {
    const puzzle = testPuzzle();
    puzzle.words = puzzle.words.map((w) => ({ ...w, key: w.letters === 'BANAAN' }));
    expect(codes(puzzle)).toEqual(['key-edges']);
  });

  it('checks the word normalization', () => {
    const puzzle = withWord('KERS', (w) => ({ ...w, display: 'kersen' }));
    expect(codes(puzzle)).toEqual(['word-normalization']);
  });

  it('reports diagonal crossings between words and within a word', () => {
    const base = { version: 1 as const, id: 'x', theme: 'x', hint: 'x', width: 2, height: 2 };
    const between: WoordslangPuzzle = {
      ...base,
      grid: ['AB', 'CD'],
      words: [
        { display: 'ad', letters: 'AD', path: p([0, 0], [1, 1]), key: true },
        { display: 'bc', letters: 'BC', path: p([0, 1], [1, 0]) },
      ],
    };
    expect(codes(between)).toEqual(['crossing']);
    const within: WoordslangPuzzle = {
      ...base,
      grid: ['AB', 'CD'],
      words: [
        { display: 'adbc', letters: 'ADBC', path: p([0, 0], [1, 1], [0, 1], [1, 0]), key: true },
      ],
    };
    expect(codes(within)).toEqual(['crossing']);
  });
});

describe('helpers', () => {
  it('spansGrid checks left↔right and top↔bottom', () => {
    expect(spansGrid(p([2, 0], [2, 1], [3, 2]), 3, 5)).toBe(true);
    expect(spansGrid(p([0, 1], [1, 1], [2, 1]), 3, 3)).toBe(true);
    expect(spansGrid(p([0, 0], [1, 1]), 3, 3)).toBe(false);
  });

  it('findCrossings ignores parallel diagonals', () => {
    const words: SlangWord[] = [
      { display: 'ab', letters: 'AB', path: p([0, 0], [1, 1]) },
      { display: 'cd', letters: 'CD', path: p([0, 1], [1, 2]) },
    ];
    expect(findCrossings(words)).toEqual([]);
  });
});

describe('isWoordslangPuzzle', () => {
  const json = () => JSON.parse(JSON.stringify(testPuzzle())) as Record<string, unknown>;

  it('accepts a puzzle read back from JSON', () => {
    expect(isWoordslangPuzzle(json())).toBe(true);
  });

  it.each([
    ['wrong version', (v: Record<string, unknown>) => ({ ...v, version: 2 })],
    ['bad id', (v: Record<string, unknown>) => ({ ...v, id: 'Met Spaties' })],
    ['too small', (v: Record<string, unknown>) => ({ ...v, width: 2 })],
    [
      'ragged row',
      (v: Record<string, unknown>) => ({ ...v, grid: ['FRUIT', ...(v.grid as string[]).slice(1)] }),
    ],
    [
      'lowercase grid',
      (v: Record<string, unknown>) => ({
        ...v,
        grid: (v.grid as string[]).map((r) => r.toLowerCase()),
      }),
    ],
    ['no words', (v: Record<string, unknown>) => ({ ...v, words: [] })],
    [
      'non-integer cell',
      (v: Record<string, unknown>) => ({
        ...v,
        words: [{ display: 'a', letters: 'A', path: [{ row: 0.5, col: 0 }] }],
      }),
    ],
    [
      'string key flag',
      (v: Record<string, unknown>) => ({
        ...v,
        words: [{ display: 'a', letters: 'A', path: [{ row: 0, col: 0 }], key: 'ja' }],
      }),
    ],
  ])('rejects %s', (_, change) => {
    expect(isWoordslangPuzzle(change(json()))).toBe(false);
  });

  it('rejects non-objects', () => {
    expect(isWoordslangPuzzle(null)).toBe(false);
    expect(isWoordslangPuzzle('puzzel')).toBe(false);
  });
});
