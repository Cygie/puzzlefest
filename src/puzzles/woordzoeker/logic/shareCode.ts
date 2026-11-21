import { decodeBase64Url, encodeBase64Url } from '@/shared/base64url';

import { ALL_DIRECTIONS } from './directions';
import { toGridLetters } from './normalize';
import type { Difficulty, Puzzle } from './types';
import { isPuzzle } from './validatePuzzle';

/**
 * Share-code format v1 (base64url of a compact JSON array). The grid itself is encoded —
 * not just the seed — so links keep working when the generator changes.
 *
 * [1, width, height, difficulty, gridLetters, [[display, row, col, directionIndex], …],
 *  solutionDisplay | 0, themeId | 0, seed]
 */
const FORMAT_VERSION = 1;
const DIFFICULTIES: readonly Difficulty[] = ['makkelijk', 'normaal', 'moeilijk'];

type WordTuple = [string, number, number, number];
type Payload = [
  number,
  number,
  number,
  number,
  string,
  WordTuple[],
  string | 0,
  string | 0,
  number,
];

export function encodePuzzle(puzzle: Puzzle): string {
  const payload: Payload = [
    FORMAT_VERSION,
    puzzle.width,
    puzzle.height,
    DIFFICULTIES.indexOf(puzzle.difficulty),
    puzzle.grid.join(''),
    puzzle.words.map((w) => [w.display, w.row, w.col, ALL_DIRECTIONS.indexOf(w.direction)]),
    puzzle.solution?.display ?? 0,
    puzzle.themeId ?? 0,
    puzzle.seed,
  ];
  return encodeBase64Url(JSON.stringify(payload));
}

/** Decodes a share code; returns null for anything invalid, tampered or of another version. */
export function decodePuzzle(code: string): Puzzle | null {
  const json = decodeBase64Url(code);
  if (json === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return null;
  }
  if (!Array.isArray(data) || data[0] !== FORMAT_VERSION || data.length !== 9) return null;

  const [, width, height, difficultyIndex, letters, words, solution, themeId, seed] = data;
  // Guard width before slicing: 0 or a fraction would loop forever / mis-split.
  if (
    !Number.isInteger(width) ||
    width < 1 ||
    typeof letters !== 'string' ||
    !Array.isArray(words)
  ) {
    return null;
  }

  const grid: string[] = [];
  for (let i = 0; i < letters.length; i += width) grid.push(letters.slice(i, i + width));

  const candidate = {
    version: 1,
    width,
    height,
    difficulty: DIFFICULTIES[difficultyIndex as number],
    seed,
    grid,
    words: words.map((w: unknown) => {
      if (!Array.isArray(w)) return null;
      const [display, row, col, direction] = w as unknown[];
      const wordLetters = typeof display === 'string' ? toGridLetters(display) : '';
      return {
        display,
        letters: wordLetters,
        row,
        col,
        direction: ALL_DIRECTIONS[direction as number],
        length: wordLetters.length,
      };
    }),
    ...(typeof solution === 'string' && solution !== ''
      ? { solution: { display: solution, letters: toGridLetters(solution) } }
      : {}),
    ...(typeof themeId === 'string' && themeId !== '' ? { themeId } : {}),
  };
  return isPuzzle(candidate) ? candidate : null;
}
