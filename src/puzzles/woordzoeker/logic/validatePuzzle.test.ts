import { describe, expect, it } from 'vitest';

import { generateGrid } from './generateGrid';
import { normalizeWordList } from './normalize';
import { TEST_PUZZLE } from './testPuzzle';
import { isPlayProgress, isPuzzle } from './validatePuzzle';

describe('isPuzzle', () => {
  it('accepts generated puzzles', () => {
    const result = generateGrid({
      words: normalizeWordList(['olifant', 'giraf', 'zebra']).words,
      width: 8,
      height: 8,
      difficulty: 'moeilijk',
      seed: 3,
    });
    expect(result.ok && isPuzzle(result.puzzle)).toBe(true);
    expect(isPuzzle(TEST_PUZZLE)).toBe(true);
  });

  it.each([
    ['null', null],
    ['wrong version', { ...TEST_PUZZLE, version: 2 }],
    ['size out of range', { ...TEST_PUZZLE, width: 30 }],
    ['unknown difficulty', { ...TEST_PUZZLE, difficulty: 'extreem' }],
    ['row count mismatch', { ...TEST_PUZZLE, grid: TEST_PUZZLE.grid.slice(1) }],
    ['lowercase letters', { ...TEST_PUZZLE, grid: ['katgo', ...TEST_PUZZLE.grid.slice(1)] }],
    ['no words', { ...TEST_PUZZLE, words: [] }],
    [
      'word not in grid',
      { ...TEST_PUZZLE, words: [{ ...TEST_PUZZLE.words[0]!, letters: 'KAX', display: 'kax' }] },
    ],
    ['word out of bounds', { ...TEST_PUZZLE, words: [{ ...TEST_PUZZLE.words[0]!, col: 4 }] }],
    ['bad direction', { ...TEST_PUZZLE, words: [{ ...TEST_PUZZLE.words[0]!, direction: 'X' }] }],
    ['duplicate words', { ...TEST_PUZZLE, words: [TEST_PUZZLE.words[0], TEST_PUZZLE.words[0]] }],
    ['bad solution', { ...TEST_PUZZLE, solution: { display: 'x', letters: 'x1' } }],
  ])('rejects %s', (_, value) => {
    expect(isPuzzle(value)).toBe(false);
  });
});

describe('isPlayProgress', () => {
  const found = [{ letters: 'KAT', start: { row: 0, col: 0 }, end: { row: 0, col: 2 } }];

  it('accepts valid progress', () => {
    expect(isPlayProgress({ found, elapsedMs: 1000 }, TEST_PUZZLE)).toBe(true);
    expect(isPlayProgress({ found: [], elapsedMs: 0 })).toBe(true);
  });

  it('rejects malformed progress or unknown words', () => {
    expect(isPlayProgress({ found, elapsedMs: -1 })).toBe(false);
    expect(isPlayProgress({ found: 'x', elapsedMs: 0 })).toBe(false);
    expect(isPlayProgress({ found: [{ letters: 'KAT' }], elapsedMs: 0 })).toBe(false);
    expect(
      isPlayProgress({ found: [{ ...found[0], letters: 'MUIS' }], elapsedMs: 0 }, TEST_PUZZLE),
    ).toBe(false);
  });
});
