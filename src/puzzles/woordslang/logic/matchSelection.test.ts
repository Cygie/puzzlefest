import { describe, expect, it } from 'vitest';

import { isSolved, matchSelection } from './matchSelection';
import { testPuzzle } from './testPuzzle';

const puzzle = testPuzzle();
const word = (letters: string) => puzzle.words.find((w) => w.letters === letters)!;
const none = new Set<string>();

describe('matchSelection', () => {
  it('finds a word along its path, forwards and backwards', () => {
    expect(matchSelection(puzzle, word('KIWI').path, none)).toEqual({
      kind: 'found',
      word: word('KIWI'),
    });
    expect(matchSelection(puzzle, [...word('KIWI').path].reverse(), none).kind).toBe('found');
  });

  it('reports a word that was already found', () => {
    expect(matchSelection(puzzle, word('KIWI').path, new Set(['KIWI'])).kind).toBe('already');
  });

  it('ignores a single cell', () => {
    expect(matchSelection(puzzle, [{ row: 0, col: 0 }], none).kind).toBe('ignore');
  });

  it('rejects other paths', () => {
    expect(
      matchSelection(
        puzzle,
        [
          { row: 0, col: 0 },
          { row: 1, col: 0 },
        ],
        none,
      ).kind,
    ).toBe('none');
  });

  it('recognises a theme word spelled along other cells', () => {
    // A second KIWI in the last row, read along a zigzag that is not KIWI's own path.
    const twice = {
      ...puzzle,
      grid: ['FRUITM', 'NABDNA', 'AANAPP', 'REEPLE', 'DRUIFC', 'NEORTI', 'KIWIVI', 'KIWIGJ'],
    };
    const other = [
      { row: 7, col: 0 },
      { row: 6, col: 1 },
      { row: 7, col: 2 },
      { row: 7, col: 3 },
    ];
    expect(matchSelection(twice, other, none).kind).toBe('elsewhere');
    expect(matchSelection(twice, other, new Set(['KIWI'])).kind).toBe('none');
  });

  it('does not reuse cells of found words', () => {
    const kiwi = word('KIWI').path;
    expect(matchSelection(puzzle, [kiwi[0]!, kiwi[1]!], new Set(['KIWI'])).kind).toBe('none');
  });
});

describe('isSolved', () => {
  it('is true only when every word is found', () => {
    const all = new Set(puzzle.words.map((w) => w.letters));
    expect(isSolved(puzzle, all)).toBe(true);
    all.delete('KIWI');
    expect(isSolved(puzzle, all)).toBe(false);
  });
});
