import { readStored, writeStored } from '@/shared/storage';

import type { WoordslangPuzzle } from './types';

const KEY = 'woordslang:progress';
const VERSION = 1;

/** Found words (letters) per puzzle id. */
type ProgressMap = Record<string, string[]>;

const isProgressMap = (value: unknown): value is ProgressMap =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every((v) => Array.isArray(v) && v.every((w) => typeof w === 'string'));

const readAll = (): ProgressMap => readStored(KEY, VERSION, isProgressMap) ?? {};

/** Found words of a puzzle; words that are not (or no longer) in the puzzle are dropped. */
export function loadFound(puzzle: WoordslangPuzzle): string[] {
  const known = new Set(puzzle.words.map((w) => w.letters));
  return [...new Set(readAll()[puzzle.id] ?? [])].filter((letters) => known.has(letters));
}

/** Saves the found words of a puzzle. Returns false when storage is unavailable. */
export function saveFound(puzzleId: string, found: readonly string[]): boolean {
  return writeStored(KEY, VERSION, { ...readAll(), [puzzleId]: [...found] });
}

export type PuzzleStatus =
  { kind: 'new' } | { kind: 'busy'; found: number; total: number } | { kind: 'solved' };

export function puzzleStatus(puzzle: WoordslangPuzzle): PuzzleStatus {
  const found = loadFound(puzzle).length;
  const total = puzzle.words.length;
  if (found === 0) return { kind: 'new' };
  return found >= total ? { kind: 'solved' } : { kind: 'busy', found, total };
}
