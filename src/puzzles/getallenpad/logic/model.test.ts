import { describe, expect, it } from 'vitest';

import { cellCount, emptyPlayerState, givenCells, givenRatio, positionsByValue } from './model';
import { TEST_PUZZLE } from './testPuzzle';

describe('model helpers', () => {
  it('counts cells as the highest value', () => {
    expect(cellCount(TEST_PUZZLE)).toBe(16);
    expect(cellCount({ width: 7, height: 5 })).toBe(35);
  });

  it('finds the cell of every value', () => {
    const positions = positionsByValue(TEST_PUZZLE.solution);
    expect(positions).toHaveLength(17);
    expect(positions[0]).toBeUndefined();
    expect(positions[1]).toEqual({ row: 0, col: 0 });
    expect(positions[5]).toEqual({ row: 1, col: 3 });
    expect(positions[16]).toEqual({ row: 3, col: 0 });
  });

  it('ignores values outside 1..N', () => {
    const positions = positionsByValue([
      [1, 9],
      [0, 2],
    ]);
    expect(positions).toEqual([
      undefined,
      { row: 0, col: 0 },
      { row: 1, col: 1 },
      undefined,
      undefined,
    ]);
  });

  it('lists the given cells and their share', () => {
    const givens = givenCells(TEST_PUZZLE);
    expect(givens.map((g) => g.value)).toEqual([1, 4, 7, 11, 16, 13]);
    expect(givens[2]!.cell).toEqual({ row: 1, col: 1 });
    expect(givenRatio(TEST_PUZZLE)).toBe(6 / 16);
  });

  it('starts a player with nothing entered and nothing to undo', () => {
    const state = emptyPlayerState(TEST_PUZZLE);
    expect(state.entries).toHaveLength(16);
    expect(state.entries.every((v) => v === null)).toBe(true);
    expect(state.history).toEqual([]);
  });
});
