import { afterEach, describe, expect, it } from 'vitest';

import { loadFound, puzzleStatus, saveFound } from './progress';
import { testPuzzle } from './testPuzzle';

const puzzle = testPuzzle();
afterEach(() => localStorage.clear());

describe('woordslang progress', () => {
  it('saves and restores found words per puzzle', () => {
    expect(loadFound(puzzle)).toEqual([]);
    expect(saveFound(puzzle.id, ['KIWI', 'PEER'])).toBe(true);
    saveFound('ander', ['X']);
    expect(loadFound(puzzle)).toEqual(['KIWI', 'PEER']);
  });

  it('drops words that are not in the puzzle', () => {
    saveFound(puzzle.id, ['KIWI', 'MANGO', 'KIWI']);
    expect(loadFound(puzzle)).toEqual(['KIWI']);
  });

  it('ignores another version or corrupt data', () => {
    localStorage.setItem(
      'puzzlefest:woordslang:progress',
      JSON.stringify({ v: 2, data: { [puzzle.id]: ['KIWI'] } }),
    );
    expect(loadFound(puzzle)).toEqual([]);
    localStorage.setItem('puzzlefest:woordslang:progress', '{kapot');
    expect(loadFound(puzzle)).toEqual([]);
  });

  it('reports new, busy and solved', () => {
    expect(puzzleStatus(puzzle)).toEqual({ kind: 'new' });
    saveFound(puzzle.id, ['KIWI']);
    expect(puzzleStatus(puzzle)).toEqual({ kind: 'busy', found: 1, total: puzzle.words.length });
    saveFound(
      puzzle.id,
      puzzle.words.map((w) => w.letters),
    );
    expect(puzzleStatus(puzzle)).toEqual({ kind: 'solved' });
  });
});
