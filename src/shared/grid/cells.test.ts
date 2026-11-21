import { describe, expect, it } from 'vitest';

import { cellFromPoint, cellIndex, inGrid, isNeighbour, sameCell } from './cells';

describe('cells', () => {
  it('compares cells', () => {
    expect(sameCell({ row: 1, col: 2 }, { row: 1, col: 2 })).toBe(true);
    expect(sameCell({ row: 1, col: 2 }, { row: 2, col: 1 })).toBe(false);
    expect(sameCell(null, { row: 0, col: 0 })).toBe(false);
  });

  it('detects the 8 neighbours', () => {
    const c = { row: 2, col: 2 };
    for (const [dr, dc] of [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ] as const) {
      expect(isNeighbour(c, { row: 2 + dr, col: 2 + dc })).toBe(true);
    }
    expect(isNeighbour(c, c)).toBe(false);
    expect(isNeighbour(c, { row: 4, col: 2 })).toBe(false);
  });

  it('indexes and bounds-checks cells', () => {
    expect(cellIndex({ row: 2, col: 3 }, 6)).toBe(15);
    expect(inGrid({ row: 7, col: 5 }, 6, 8)).toBe(true);
    expect(inGrid({ row: 8, col: 0 }, 6, 8)).toBe(false);
    expect(inGrid({ row: 0, col: -1 }, 6, 8)).toBe(false);
  });

  it('maps screen points to cells', () => {
    const rect = { left: 10, top: 20, width: 100, height: 50 };
    expect(cellFromPoint(55, 45, rect, 5, 5)).toEqual({ row: 2, col: 2 });
    expect(cellFromPoint(200, 100, rect, 5, 5)).toBeNull();
    expect(cellFromPoint(200, 100, rect, 5, 5, true)).toEqual({ row: 4, col: 4 });
  });
});
