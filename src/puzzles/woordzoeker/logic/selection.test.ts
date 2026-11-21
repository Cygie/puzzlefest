import { describe, expect, it } from 'vitest';

import { cellFromPoint, leftoverCells, matchWord, sameCell, snapLine } from './selection';
import type { Puzzle } from './types';

const rect = { left: 10, top: 20, width: 100, height: 50 }; // 5 columns × 5 rows → 20×10 px cells

describe('cellFromPoint', () => {
  it('maps a point to a cell', () => {
    expect(cellFromPoint(10, 20, rect, 5, 5)).toEqual({ row: 0, col: 0 });
    expect(cellFromPoint(109, 69, rect, 5, 5)).toEqual({ row: 4, col: 4 });
    expect(cellFromPoint(55, 45, rect, 5, 5)).toEqual({ row: 2, col: 2 });
  });

  it('returns null outside the grid unless clamping', () => {
    expect(cellFromPoint(5, 30, rect, 5, 5)).toBeNull();
    expect(cellFromPoint(200, 100, rect, 5, 5)).toBeNull();
    expect(cellFromPoint(200, 100, rect, 5, 5, true)).toEqual({ row: 4, col: 4 });
    expect(cellFromPoint(0, 0, rect, 5, 5, true)).toEqual({ row: 0, col: 0 });
  });

  it('handles an unmeasured element', () => {
    expect(cellFromPoint(1, 1, { left: 0, top: 0, width: 0, height: 0 }, 5, 5)).toBeNull();
  });
});

describe('snapLine', () => {
  const at = (row: number, col: number) => ({ row, col });

  it('returns a single cell when start equals end', () => {
    expect(snapLine(at(1, 1), at(1, 1), 5, 5)).toEqual({ cells: [at(1, 1)], direction: null });
  });

  it('follows straight and diagonal lines in all directions', () => {
    expect(snapLine(at(0, 0), at(0, 3), 5, 5).direction).toBe('E');
    expect(snapLine(at(0, 3), at(0, 0), 5, 5).direction).toBe('W');
    expect(snapLine(at(0, 0), at(3, 0), 5, 5).direction).toBe('S');
    expect(snapLine(at(3, 0), at(0, 0), 5, 5).direction).toBe('N');
    expect(snapLine(at(0, 0), at(3, 3), 5, 5).direction).toBe('SE');
    expect(snapLine(at(3, 0), at(0, 3), 5, 5).direction).toBe('NE');
    expect(snapLine(at(3, 3), at(0, 0), 5, 5).direction).toBe('NW');
    expect(snapLine(at(0, 3), at(3, 0), 5, 5).direction).toBe('SW');
    expect(snapLine(at(0, 0), at(2, 2), 5, 5).cells).toEqual([at(0, 0), at(1, 1), at(2, 2)]);
  });

  it('snaps an off-angle swipe to the nearest direction', () => {
    // Mostly horizontal with a small drift → E, length from the larger delta.
    expect(snapLine(at(2, 0), at(3, 4), 5, 5)).toMatchObject({ direction: 'E' });
    expect(snapLine(at(2, 0), at(3, 4), 5, 5).cells).toHaveLength(5);
    // Close to the diagonal → SE.
    expect(snapLine(at(0, 0), at(3, 4), 5, 5).direction).toBe('SE');
  });

  it('clips at the grid edge', () => {
    const line = snapLine(at(3, 0), at(0, 4), 5, 5); // snaps NE, 5 wanted, 4 fit
    expect(line.direction).toBe('NE');
    expect(line.cells).toHaveLength(4);
  });
});

const puzzle: Puzzle = {
  version: 1,
  width: 5,
  height: 5,
  difficulty: 'moeilijk',
  seed: 1,
  grid: ['KATXQ', 'HONDZ', 'VISRY', 'KATER', 'ABCDE'],
  words: [
    { display: 'kat', letters: 'KAT', row: 0, col: 0, direction: 'E', length: 3 },
    { display: 'hond', letters: 'HOND', row: 1, col: 0, direction: 'E', length: 4 },
    { display: 'vis', letters: 'VIS', row: 2, col: 0, direction: 'E', length: 3 },
  ],
};

describe('matchWord', () => {
  const line = (cells: [number, number][]) => ({
    cells: cells.map(([row, col]) => ({ row, col })),
    direction: null,
  });

  it('matches forwards and backwards', () => {
    expect(
      matchWord(
        puzzle,
        line([
          [1, 0],
          [1, 1],
          [1, 2],
          [1, 3],
        ]),
        new Set(),
      )?.letters,
    ).toBe('HOND');
    expect(
      matchWord(
        puzzle,
        line([
          [2, 2],
          [2, 1],
          [2, 0],
        ]),
        new Set(),
      )?.letters,
    ).toBe('VIS');
  });

  it('accepts a second legitimate occurrence (KAT inside KATER)', () => {
    expect(
      matchWord(
        puzzle,
        line([
          [3, 0],
          [3, 1],
          [3, 2],
        ]),
        new Set(),
      )?.letters,
    ).toBe('KAT');
  });

  it('ignores found words, non-words and single cells', () => {
    expect(
      matchWord(
        puzzle,
        line([
          [0, 0],
          [0, 1],
          [0, 2],
        ]),
        new Set(['KAT']),
      ),
    ).toBeUndefined();
    expect(
      matchWord(
        puzzle,
        line([
          [0, 0],
          [0, 1],
        ]),
        new Set(),
      ),
    ).toBeUndefined();
    expect(matchWord(puzzle, line([[0, 0]]), new Set())).toBeUndefined();
  });
});

describe('leftoverCells', () => {
  it('returns cells outside all words in row order', () => {
    const cells = leftoverCells(puzzle);
    expect(cells).toHaveLength(25 - 10);
    expect(cells[0]).toEqual({ row: 0, col: 3 });
    expect(cells.some((c) => sameCell(c, { row: 1, col: 2 }))).toBe(false);
  });
});

describe('sameCell', () => {
  it('compares cells and handles null', () => {
    expect(sameCell({ row: 1, col: 2 }, { row: 1, col: 2 })).toBe(true);
    expect(sameCell({ row: 1, col: 2 }, { row: 2, col: 1 })).toBe(false);
    expect(sameCell(null, { row: 0, col: 0 })).toBe(false);
  });
});
