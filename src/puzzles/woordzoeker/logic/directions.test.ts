import { describe, expect, it } from 'vitest';

import { DIRECTIONS_BY_DIFFICULTY, wordCells } from './directions';

describe('wordCells', () => {
  it('walks in the given direction', () => {
    expect(wordCells(0, 0, 'E', 3)).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
    expect(wordCells(4, 1, 'NE', 3)).toEqual([
      { row: 4, col: 1 },
      { row: 3, col: 2 },
      { row: 2, col: 3 },
    ]);
    expect(wordCells(2, 2, 'W', 2)).toEqual([
      { row: 2, col: 2 },
      { row: 2, col: 1 },
    ]);
  });
});

describe('DIRECTIONS_BY_DIFFICULTY', () => {
  it('adds directions per level', () => {
    expect(DIRECTIONS_BY_DIFFICULTY.makkelijk).toEqual(['E', 'S']);
    expect(DIRECTIONS_BY_DIFFICULTY.normaal).toEqual(['E', 'S', 'SE', 'NE']);
    expect(DIRECTIONS_BY_DIFFICULTY.moeilijk).toHaveLength(8);
  });
});
