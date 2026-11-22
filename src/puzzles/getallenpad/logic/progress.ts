import { readStored, writeStored } from '@/shared/storage';

import { cellCount, emptyPlayerState } from './model';
import { isSolved } from './play';
import type { GetallenpadPuzzle, PlayerState } from './types';

const KEY = 'getallenpad:progress';
const VERSION = 1;

/** The player's entries (row-major) per puzzle id. */
type ProgressMap = Record<string, (number | null)[]>;

const isProgressMap = (value: unknown): value is ProgressMap =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  Object.values(value).every(
    (entries) =>
      Array.isArray(entries) &&
      entries.every((v) => v === null || (typeof v === 'number' && Number.isInteger(v))),
  );

const readAll = (): ProgressMap => readStored(KEY, VERSION, isProgressMap) ?? {};

/**
 * Saved progress of a puzzle (without undo history). Data that does not fit the puzzle
 * (other size, numbers outside 1..N, entries on givens) is dropped.
 */
export function loadProgress(puzzle: GetallenpadPuzzle): PlayerState {
  const fresh = emptyPlayerState(puzzle);
  const saved = readAll()[puzzle.id];
  const n = cellCount(puzzle);
  if (!saved || saved.length !== n) return fresh;
  const givens = puzzle.givens.flat();
  const entries = saved.map((v, i) =>
    v !== null && v >= 1 && v <= n && givens[i] === null ? v : null,
  );
  return { entries, history: [] };
}

/** Saves the entries of a puzzle. Returns false when storage is unavailable. */
export function saveProgress(puzzleId: string, entries: readonly (number | null)[]): boolean {
  return writeStored(KEY, VERSION, { ...readAll(), [puzzleId]: [...entries] });
}

export type PuzzleStatus =
  { kind: 'new' } | { kind: 'busy'; filled: number; open: number } | { kind: 'solved' };

export function puzzleStatus(puzzle: GetallenpadPuzzle): PuzzleStatus {
  const state = loadProgress(puzzle);
  const filled = state.entries.filter((v) => v !== null).length;
  if (filled === 0) return { kind: 'new' };
  if (isSolved(puzzle, state)) return { kind: 'solved' };
  const open = puzzle.givens.flat().filter((v) => v === null).length;
  return { kind: 'busy', filled, open };
}
