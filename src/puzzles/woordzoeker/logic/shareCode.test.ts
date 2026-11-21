import { describe, expect, it } from 'vitest';

import { createRng } from '@/shared/random';
import { encodeBase64Url } from '@/shared/base64url';

import { pickThemeWords, THEMES } from '../data/themes';
import { generateGrid } from './generateGrid';
import { normalizeWordList } from './normalize';
import { decodePuzzle, encodePuzzle } from './shareCode';
import { TEST_PUZZLE } from './testPuzzle';
import type { Puzzle } from './types';

function generated(width: number, height: number, count: number, solution?: string): Puzzle {
  const words = normalizeWordList(
    pickThemeWords(THEMES[0]!, { count, maxLength: Math.max(width, height), rng: createRng(4) }),
  ).words;
  const result = generateGrid({
    words,
    width,
    height,
    difficulty: 'moeilijk',
    solution,
    seed: 9,
    themeId: 'dieren',
  });
  if (!result.ok) throw new Error(result.reason);
  return result.puzzle;
}

describe('share code', () => {
  it('round-trips a puzzle exactly', () => {
    expect(decodePuzzle(encodePuzzle(TEST_PUZZLE))).toEqual(TEST_PUZZLE);
    const big = generated(20, 20, 20);
    expect(decodePuzzle(encodePuzzle(big))).toEqual(big);
  });

  it('keeps accents, a solution sentence and missing theme intact', () => {
    const puzzle: Puzzle = {
      ...TEST_PUZZLE,
      themeId: undefined,
      words: [{ ...TEST_PUZZLE.words[0]!, display: 'Kät' }, ...TEST_PUZZLE.words.slice(1)],
      solution: { display: 'Goed gedaan!', letters: 'GOEDGEDAAN' },
    };
    // Solution letters are recomputed from the display text on decode.
    const decoded = decodePuzzle(
      encodePuzzle({ ...puzzle, solution: { display: 'Goed gedaan', letters: 'GOEDGEDAAN' } }),
    );
    expect(decoded?.words[0]?.display).toBe('Kät');
    expect(decoded?.solution).toEqual({ display: 'Goed gedaan', letters: 'GOEDGEDAAN' });
    expect(decoded).not.toHaveProperty('themeId');
  });

  it('stays under 2000 characters for 20×20 with 20 words', () => {
    const code = encodePuzzle(generated(20, 20, 20));
    expect(code.length).toBeLessThan(2000);
  });

  it.each([
    ['garbage', 'not*base64'],
    ['not JSON', encodeBase64Url('hallo')],
    ['wrong version', encodeBase64Url(JSON.stringify([2, 5, 5, 0, '', [], 0, 0, 1]))],
    ['zero width (would loop)', encodeBase64Url(JSON.stringify([1, 0, 5, 0, 'ABC', [], 0, 0, 1]))],
    ['empty', ''],
  ])('rejects %s', (_, code) => {
    expect(decodePuzzle(code)).toBeNull();
  });

  it('rejects a tampered grid', () => {
    const code = encodePuzzle(TEST_PUZZLE);
    const payload = JSON.parse(atob(code.replace(/-/g, '+').replace(/_/g, '/')));
    payload[4] = 'Q' + payload[4].slice(1); // breaks "KAT"
    expect(decodePuzzle(encodeBase64Url(JSON.stringify(payload)))).toBeNull();
  });
});
